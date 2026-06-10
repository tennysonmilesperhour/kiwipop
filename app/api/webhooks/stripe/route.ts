import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { queuePostPurchaseSeries } from '@/lib/email-queue';
import { redeemCodeForOrder } from '@/lib/wholesale-codes';

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

  const { data: updatedOrder, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      ...(amountTotal !== null ? { total_cents: amountTotal } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('discount_code')
    .maybeSingle<{ discount_code: string | null }>();

  if (error) {
    console.error('[stripe-webhook] failed to mark order paid', { orderId, error });
    return;
  }

  // Burn the one-time wholesale code now that payment has actually landed.
  if (updatedOrder?.discount_code) {
    await redeemCodeForOrder(updatedOrder.discount_code, orderId);
  }

  await decrementInventoryForOrder(orderId);

  // ---- Post-purchase email series ----
  // Fire-and-forget: send order confirmation + queue review request.
  const customerEmail = session.customer_details?.email ?? session.customer_email;
  if (customerEmail) {
    // Load order items with product names for the confirmation email
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('quantity, price_cents, products(name)')
      .eq('order_id', orderId);

    const emailItems = (orderItems ?? []).map((item: Record<string, unknown>) => ({
      name: (item.products as { name: string } | null)?.name ?? 'Kiwi Pop',
      quantity: item.quantity as number,
      priceCents: (item.price_cents as number) * (item.quantity as number),
    }));

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
