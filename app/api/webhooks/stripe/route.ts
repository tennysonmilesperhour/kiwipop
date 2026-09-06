import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { queuePostPurchaseSeries, notifyAdminOfSale } from '@/lib/email-queue';
import { redeemDiscountForOrder } from '@/lib/discounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

interface OrderItemRow {
  product_id: string;
  quantity: number;
}

async function decrementInventoryForOrder(orderId: string): Promise<void> {
  const { data: items, error } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (error || !items) {
    console.error('[stripe-webhook] failed to load order items', { orderId, error });
    return;
  }

  for (const item of items as OrderItemRow[]) {
    const { error: rpcError } = await supabaseAdmin.rpc(
      'decrement_stock_for_product',
      { p_product_id: item.product_id, p_quantity: item.quantity }
    );
    if (rpcError) {
      console.error('[stripe-webhook] decrement_stock_for_product failed', {
        orderId,
        productId: item.product_id,
        quantity: item.quantity,
        rpcError,
      });
    }
  }
}

/**
 * Donation checkouts reuse the orders table but stash a marker object in
 * `shipping_address` instead of a real address (see /api/donate-checkout).
 */
function isDonationOrder(shippingAddress: Record<string, unknown> | null): boolean {
  return shippingAddress?.kind === 'donation';
}

/** Render a stored shipping address as display lines for the sale alert. */
function formatShippingLines(
  shippingAddress: Record<string, unknown> | null
): string[] {
  if (!shippingAddress || isDonationOrder(shippingAddress)) return [];

  const str = (key: string): string =>
    typeof shippingAddress[key] === 'string' ? (shippingAddress[key] as string) : '';

  const name = [str('firstName'), str('lastName')].filter(Boolean).join(' ');
  const cityLine = [
    [str('city'), str('state')].filter(Boolean).join(', '),
    str('zip'),
  ]
    .filter(Boolean)
    .join(' ');

  return [name, str('address'), cityLine, str('country')].filter(Boolean);
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error('[stripe-webhook] checkout.session.completed missing orderId metadata');
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Capture the actual paid amount (subtotal + shipping + any future taxes).
  // The order row was created with subtotal-only at /api/checkout time, so
  // overwrite with session.amount_total here so revenue dashboards are
  // accurate. session.amount_total is already in cents.
  const amountTotal =
    typeof session.amount_total === 'number' ? session.amount_total : null;
  // Stripe performs the final address collection. Persist that exact address
  // instead of relying on the pre-payment form copy, so fulfillment and label
  // purchasing always use what the customer confirmed at payment.
  const stripeShipping = session.shipping_details;
  const stripeNameParts = stripeShipping?.name?.trim().split(/\s+/) ?? [];
  const confirmedShippingAddress = stripeShipping?.address
    ? {
        firstName: stripeNameParts[0] ?? '',
        lastName: stripeNameParts.slice(1).join(' '),
        address: [
          stripeShipping.address.line1,
          stripeShipping.address.line2,
        ]
          .filter(Boolean)
          .join(', '),
        city: stripeShipping.address.city ?? '',
        state: stripeShipping.address.state ?? '',
        zip: stripeShipping.address.postal_code ?? '',
        country: stripeShipping.address.country ?? 'US',
      }
    : null;

  const { data: updatedOrder, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      ...(amountTotal !== null ? { total_cents: amountTotal } : {}),
      ...(confirmedShippingAddress
        ? { shipping_address: confirmedShippingAddress }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('discount_code, shipping_address')
    .maybeSingle<{
      discount_code: string | null;
      shipping_address: Record<string, unknown> | null;
    }>();

  if (error) {
    console.error('[stripe-webhook] failed to mark order paid', { orderId, error });
    return;
  }

  // Burn the one-time discount code (wholesale or rewards) now that payment
  // has actually landed.
  if (updatedOrder?.discount_code) {
    await redeemDiscountForOrder(updatedOrder.discount_code, orderId);
  }

  await decrementInventoryForOrder(orderId);

  // NOTE: raw-material (ingredient) deduction intentionally does NOT happen here.
  // It runs when the order is marked fulfilled (shipped/completed) from the
  // admin orders page — see app/api/admin/orders/[id] and .../bulk-status.

  // Award rewards points to the buyer's account (no-op for guest checkout).
  const { error: pointsError } = await supabaseAdmin.rpc('award_points_for_order', {
    p_order_id: orderId,
  });
  if (pointsError) {
    console.error('[stripe-webhook] award_points_for_order failed', { orderId, pointsError });
  }

  // ---- Order emails ----
  const customerEmail = session.customer_details?.email ?? session.customer_email;

  // Load order items with product names — used by both the customer
  // confirmation and the internal sale alert.
  const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select('quantity, price_cents, products(name)')
    .eq('order_id', orderId);

  const emailItems = (orderItems ?? []).map((item: Record<string, unknown>) => ({
    name: (item.products as { name: string } | null)?.name ?? 'Kiwi Pop',
    quantity: item.quantity as number,
    priceCents: (item.price_cents as number) * (item.quantity as number),
  }));

  // Internal alert to the shop owner. Awaited (not fire-and-forget) so the
  // send actually completes before the serverless function is frozen, but
  // notifyAdminOfSale swallows its own errors so a mail failure can't fail
  // the webhook and trigger a Stripe retry of the side effects above.
  await notifyAdminOfSale({
    orderId,
    totalCents: amountTotal ?? 0,
    customerEmail: customerEmail ?? null,
    items: emailItems,
    discountCode: updatedOrder?.discount_code ?? null,
    shippingLines: formatShippingLines(updatedOrder?.shipping_address ?? null),
    isDonation: isDonationOrder(updatedOrder?.shipping_address ?? null),
  });

  // ---- Post-purchase email series ----
  // Fire-and-forget: send order confirmation + queue review request.
  if (customerEmail) {
    queuePostPurchaseSeries({
      email: customerEmail,
      orderId,
      totalCents: amountTotal ?? 0,
      items: emailItems,
    }).catch((err) => {
      console.error('[stripe-webhook] failed to queue post-purchase emails', {
        orderId,
        err,
      });
    });
  }
}

async function handlePaymentIntentFailed(
  intent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;

  await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (error || !order) return;

  if (order.status !== 'cancelled') {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
  }
}

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET not configured' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] handler failed', { type: event.type, err });
    return NextResponse.json(
      { error: 'Handler failed', type: event.type },
      { status: 500 }
    );
  }
}
