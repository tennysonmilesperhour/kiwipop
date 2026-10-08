import 'server-only';

import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { queuePostPurchaseSeries, notifyAdminOfSale } from '@/lib/email-queue';
import { redeemDiscountForOrder } from '@/lib/discounts';

interface OrderItemRow {
  product_id: string;
  quantity: number;
}

export interface ApplyPaidCheckoutResult {
  /** True when this call moved the order from pending to paid and ran side effects. */
  transitioned: boolean;
  error?: string;
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

async function decrementInventoryForOrder(orderId: string): Promise<void> {
  const { data: items, error } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (error || !items) {
    console.error('[order-paid] failed to load order items', { orderId, error });
    return;
  }

  for (const item of items as OrderItemRow[]) {
    const { error: rpcError } = await supabaseAdmin.rpc(
      'decrement_stock_for_product',
      { p_product_id: item.product_id, p_quantity: item.quantity }
    );
    if (rpcError) {
      console.error('[order-paid] decrement_stock_for_product failed', {
        orderId,
        productId: item.product_id,
        quantity: item.quantity,
        rpcError,
      });
    }
  }
}

/**
 * Mark a Stripe Checkout Session's order paid, once.
 *
 * The update matches `status = pending` only. Whichever path wins — the
 * Stripe webhook or admin reconcile — runs stock decrement, points, discount
 * redemption, and the sale emails. The loser sees zero rows and does not
 * repeat those side effects. Reconcile used to flip pending → paid and stop,
 * so paid orders never reached `decrement_stock_for_product` when the webhook
 * did not fire.
 */
export async function applyPaidCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<ApplyPaidCheckoutResult> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error('[order-paid] checkout.session.completed missing orderId metadata');
    return { transitioned: false, error: 'missing orderId metadata' };
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
    .eq('status', 'pending')
    .select('discount_code, shipping_address')
    .maybeSingle<{
      discount_code: string | null;
      shipping_address: Record<string, unknown> | null;
    }>();

  if (error) {
    console.error('[order-paid] failed to mark order paid', { orderId, error });
    return { transitioned: false, error: error.message };
  }

  // Already paid, shipped, completed, or cancelled. Do not decrement again.
  if (!updatedOrder) {
    return { transitioned: false };
  }

  if (updatedOrder.discount_code) {
    await redeemDiscountForOrder(updatedOrder.discount_code, orderId);
  }

  await decrementInventoryForOrder(orderId);

  // NOTE: raw-material (ingredient) deduction intentionally does NOT happen here.
  // It runs when the order is marked fulfilled (shipped/completed) from the
  // admin orders page — see app/api/admin/orders/[id] and .../bulk-status.

  const { error: pointsError } = await supabaseAdmin.rpc('award_points_for_order', {
    p_order_id: orderId,
  });
  if (pointsError) {
    console.error('[order-paid] award_points_for_order failed', { orderId, pointsError });
  }

  const customerEmail = session.customer_details?.email ?? session.customer_email;

  const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select('quantity, price_cents, products(name)')
    .eq('order_id', orderId);

  const emailItems = (orderItems ?? []).map((item: Record<string, unknown>) => ({
    name: (item.products as { name: string } | null)?.name ?? 'Kiwi Pop',
    quantity: item.quantity as number,
    priceCents: (item.price_cents as number) * (item.quantity as number),
  }));

  await notifyAdminOfSale({
    orderId,
    totalCents: amountTotal ?? 0,
    customerEmail: customerEmail ?? null,
    items: emailItems,
    discountCode: updatedOrder.discount_code ?? null,
    shippingLines: formatShippingLines(updatedOrder.shipping_address ?? null),
    isDonation: isDonationOrder(updatedOrder.shipping_address ?? null),
  });

  if (customerEmail) {
    queuePostPurchaseSeries({
      email: customerEmail,
      orderId,
      totalCents: amountTotal ?? 0,
      items: emailItems,
    }).catch((err) => {
      console.error('[order-paid] failed to queue post-purchase emails', {
        orderId,
        err,
      });
    });
  }

  return { transitioned: true };
}
