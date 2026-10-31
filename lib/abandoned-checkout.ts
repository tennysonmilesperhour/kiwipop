import 'server-only';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNotificationEmail } from '@/lib/email';
import { abandonedCheckoutEmail } from '@/lib/email-templates';
import {
  getAbandonedCheckoutEmailsEnabled,
  getPreorderOnlyMode,
} from '@/lib/settings';
import { isRetiredSku } from '@/lib/retired';
import {
  RECOVERY_COOLDOWN_DAYS,
  decideRecovery,
  latestPerEmail,
} from '@/lib/abandoned-checkout-rules';

/* =========================================================
   CHECKOUT ABANDONMENT RECOVERY
   =========================================================
   Recording is always on: every storefront order whose Stripe
   Checkout Session expires unpaid gets a row in
   abandoned_checkouts (from the webhook or the reconcile pass).

   Sending is OFF until app_settings.abandoned_checkout_emails_enabled
   is true AND MAIL_POSTAL_ADDRESS is set. The daily cron then sends
   at most one email per abandoned cart. Copy and the switch are
   documented in docs/abandoned-checkout-email.md.
   ========================================================= */

const PAID_STATUSES_EXCLUDED = '(pending,cancelled)';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SENDS_PER_RUN = 50;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AbandonedItem {
  product_id: string;
  name: string;
  quantity: number;
  price_cents: number;
}

interface AbandonedRow {
  id: string;
  order_id: string;
  email: string;
  first_name: string | null;
  items: AbandonedItem[];
  checkout_started_at: string;
  abandoned_at: string;
  recovery_status: string;
  recovered_at: string | null;
  recovery_token: string;
  unsubscribed_at: string | null;
}

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.kiwipop.fun').replace(
    /\/$/,
    ''
  );
}

/** Escape % and _ so an address can be matched with ilike exactly. */
function likeExact(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Record an expired, unpaid storefront checkout. Idempotent per order. Never
 * throws: callers are the Stripe webhook and reconcile, which must not fail
 * because of this.
 */
export async function recordAbandonedCheckout(
  orderId: string,
  stripeSessionId: string | null
): Promise<void> {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(
        'id, user_email, status, shipping_address, subtotal_cents, total_cents, discount_code, created_at'
      )
      .eq('id', orderId)
      .maybeSingle<{
        id: string;
        user_email: string | null;
        status: string;
        shipping_address: Record<string, unknown> | null;
        subtotal_cents: number | null;
        total_cents: number | null;
        discount_code: string | null;
        created_at: string;
      }>();

    if (error || !order) return;
    if (!order.user_email) return;
    if (order.status !== 'pending' && order.status !== 'cancelled') return;
    // Donations reuse the orders table; they are not carts.
    if (order.shipping_address?.kind === 'donation') return;

    const { data: itemRows } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity, price_cents, products ( name )')
      .eq('order_id', orderId);

    const items: AbandonedItem[] = (
      (itemRows ?? []) as unknown as Array<{
        product_id: string;
        quantity: number;
        price_cents: number;
        products: { name: string } | Array<{ name: string }> | null;
      }>
    ).map((row) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      return {
        product_id: row.product_id,
        name: product?.name ?? 'kiwi pop',
        quantity: row.quantity,
        price_cents: row.price_cents,
      };
    });
    if (items.length === 0) return;

    const firstName =
      typeof order.shipping_address?.firstName === 'string'
        ? (order.shipping_address.firstName as string)
        : null;

    const { error: insertError } = await supabaseAdmin
      .from('abandoned_checkouts')
      .upsert(
        {
          order_id: order.id,
          stripe_session_id: stripeSessionId,
          email: order.user_email.trim().toLowerCase(),
          first_name: firstName,
          items,
          subtotal_cents: order.subtotal_cents,
          total_cents: order.total_cents,
          discount_code: order.discount_code,
          checkout_started_at: order.created_at,
        },
        { onConflict: 'order_id', ignoreDuplicates: true }
      );

    if (insertError) {
      console.error('[abandoned-checkout] record failed', {
        orderId,
        insertError,
      });
    }
  } catch (err) {
    console.error('[abandoned-checkout] record threw', { orderId, err });
  }
}

/**
 * When an order pays, mark that customer's earlier abandoned carts (last 30
 * days) as recovered, so no recovery email goes out and the admin can count
 * what came back. Never throws.
 */
export async function markAbandonedCheckoutsRecovered(
  paidOrderId: string,
  email: string | null
): Promise<void> {
  if (!email) return;
  try {
    const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
    const { error } = await supabaseAdmin
      .from('abandoned_checkouts')
      .update({
        recovered_order_id: paidOrderId,
        recovered_at: new Date().toISOString(),
      })
      .eq('email', email.trim().toLowerCase())
      .is('recovered_at', null)
      .neq('order_id', paidOrderId)
      .gte('abandoned_at', since);
    if (error) {
      console.error('[abandoned-checkout] mark recovered failed', {
        paidOrderId,
        error,
      });
    }
  } catch (err) {
    console.error('[abandoned-checkout] mark recovered threw', {
      paidOrderId,
      err,
    });
  }
}

export interface RecoveryRunSummary {
  enabled: boolean;
  blocked?: string;
  sent: number;
  skipped: number;
  failed: number;
  waiting: number;
}

async function hasPaidSince(email: string, sinceIso: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id')
    .ilike('user_email', likeExact(email))
    .not('status', 'in', PAID_STATUSES_EXCLUDED)
    .gte('created_at', sinceIso)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function isUnsubscribed(email: string): Promise<boolean> {
  const [signup, cart] = await Promise.all([
    supabaseAdmin
      .from('email_signups')
      .select('id')
      .ilike('email', likeExact(email))
      .not('unsubscribed_at', 'is', null)
      .limit(1),
    supabaseAdmin
      .from('abandoned_checkouts')
      .select('id')
      .eq('email', email)
      .not('unsubscribed_at', 'is', null)
      .limit(1),
  ]);
  return (signup.data?.length ?? 0) > 0 || (cart.data?.length ?? 0) > 0;
}

async function emailedRecently(email: string, now: Date): Promise<boolean> {
  const since = new Date(
    now.getTime() - RECOVERY_COOLDOWN_DAYS * DAY_MS
  ).toISOString();
  const { data } = await supabaseAdmin
    .from('abandoned_checkouts')
    .select('id')
    .eq('email', email)
    .gte('recovery_sent_at', since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function markSkipped(id: string, reason: string): Promise<void> {
  await supabaseAdmin
    .from('abandoned_checkouts')
    .update({ recovery_status: 'skipped', recovery_skip_reason: reason })
    .eq('id', id)
    .eq('recovery_status', 'pending');
}

/**
 * Send due recovery emails. Called once a day by the cron. Does nothing
 * unless the switch is on and a postal address is configured.
 */
export async function processAbandonedCheckoutRecovery(
  now: Date = new Date()
): Promise<RecoveryRunSummary> {
  const summary: RecoveryRunSummary = {
    enabled: false,
    sent: 0,
    skipped: 0,
    failed: 0,
    waiting: 0,
  };

  if (!(await getAbandonedCheckoutEmailsEnabled())) return summary;
  summary.enabled = true;

  const postalAddress = process.env.MAIL_POSTAL_ADDRESS?.trim();
  if (!postalAddress) {
    summary.blocked =
      'MAIL_POSTAL_ADDRESS is not set; commercial email must carry a postal address';
    return summary;
  }

  const { data, error } = await supabaseAdmin
    .from('abandoned_checkouts')
    .select(
      'id, order_id, email, first_name, items, checkout_started_at, abandoned_at, recovery_status, recovered_at, recovery_token, unsubscribed_at'
    )
    .eq('recovery_status', 'pending')
    .order('abandoned_at', { ascending: true })
    .limit(500);

  if (error) {
    summary.blocked = `load failed: ${error.message}`;
    return summary;
  }

  const { keep, duplicates } = latestPerEmail((data ?? []) as AbandonedRow[]);
  for (const dup of duplicates) {
    await markSkipped(dup.id, 'newer_cart');
    summary.skipped++;
  }

  const origin = siteOrigin();

  for (const row of keep) {
    if (summary.sent >= MAX_SENDS_PER_RUN) break;

    const decision = decideRecovery(row, {
      now,
      hasPaidSince:
        row.recovered_at !== null ||
        (await hasPaidSince(row.email, row.checkout_started_at)),
      unsubscribed:
        row.unsubscribed_at !== null || (await isUnsubscribed(row.email)),
      emailedRecently: await emailedRecently(row.email, now),
    });

    if (decision.action === 'wait') {
      summary.waiting++;
      continue;
    }
    if (decision.action === 'skip') {
      await markSkipped(row.id, decision.reason);
      summary.skipped++;
      continue;
    }

    // Claim the row before sending so an overlapping run cannot send twice.
    const { data: claimed } = await supabaseAdmin
      .from('abandoned_checkouts')
      .update({ recovery_status: 'sent', recovery_sent_at: now.toISOString() })
      .eq('id', row.id)
      .eq('recovery_status', 'pending')
      .select('id');
    if (!claimed || claimed.length === 0) continue;

    const unsubscribeUrl = `${origin}/api/email/unsubscribe?t=${row.recovery_token}`;
    const template = abandonedCheckoutEmail({
      firstName: row.first_name,
      items: row.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      restoreUrl: `${origin}/checkout/recover?t=${row.recovery_token}`,
      unsubscribeUrl,
      postalAddress,
    });

    const result = await sendNotificationEmail({
      to: row.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    await supabaseAdmin.from('email_queue').insert({
      to_email: row.email,
      email_type: 'abandoned_checkout',
      send_at: now.toISOString(),
      metadata: { abandonedCheckoutId: row.id, orderId: row.order_id },
      status: result.ok ? 'sent' : 'failed',
      sent_at: result.ok ? new Date().toISOString() : null,
      error_message: result.reason ?? null,
      created_at: new Date().toISOString(),
    });

    if (result.ok) {
      summary.sent++;
    } else {
      // Not retried: one attempt per cart keeps the "one email max" promise
      // simple even when the mail provider half-accepted a message.
      await supabaseAdmin
        .from('abandoned_checkouts')
        .update({
          recovery_status: 'failed',
          recovery_sent_at: null,
          recovery_error: result.reason ?? 'unknown error',
        })
        .eq('id', row.id);
      summary.failed++;
    }
  }

  return summary;
}

/**
 * Unsubscribe the address behind a recovery token from marketing email.
 * Returns false for an unknown token.
 */
export async function unsubscribeByRecoveryToken(token: string): Promise<boolean> {
  if (!UUID_RE.test(token)) return false;

  const { data: row } = await supabaseAdmin
    .from('abandoned_checkouts')
    .select('id, email')
    .eq('recovery_token', token)
    .maybeSingle<{ id: string; email: string }>();
  if (!row) return false;

  const nowIso = new Date().toISOString();

  await supabaseAdmin
    .from('abandoned_checkouts')
    .update({ unsubscribed_at: nowIso })
    .eq('email', row.email)
    .is('unsubscribed_at', null);

  const { data: updated } = await supabaseAdmin
    .from('email_signups')
    .update({ unsubscribed_at: nowIso, marketing_opt_in: false })
    .ilike('email', likeExact(row.email))
    .select('id');

  if (!updated || updated.length === 0) {
    await supabaseAdmin.from('email_signups').insert({
      email: row.email,
      source: 'unsubscribe',
      marketing_opt_in: false,
      unsubscribed_at: nowIso,
    });
  }

  return true;
}

export interface RestoredCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isPreorder: boolean;
  preorderDeadline?: string;
}

/**
 * The cart behind a recovery link, rebuilt from today's catalog (current
 * price, retired products dropped). Returns only product data, never the
 * customer's address or email.
 */
export async function restoreCartByRecoveryToken(
  token: string
): Promise<RestoredCartItem[] | null> {
  if (!UUID_RE.test(token)) return null;

  const { data: row } = await supabaseAdmin
    .from('abandoned_checkouts')
    .select('items')
    .eq('recovery_token', token)
    .maybeSingle<{ items: AbandonedItem[] }>();
  if (!row) return null;

  const ids = row.items.map((i) => i.product_id);
  if (ids.length === 0) return [];

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, sku, name, price_cents, image_url, preorder_only, preorder_deadline')
    .in('id', ids);

  const preorderOnlyMode = await getPreorderOnlyMode();
  const byId = new Map(
    (
      (products ?? []) as Array<{
        id: string;
        sku: string | null;
        name: string;
        price_cents: number;
        image_url: string | null;
        preorder_only: boolean;
        preorder_deadline: string | null;
      }>
    ).map((p) => [p.id, p])
  );

  const restored: RestoredCartItem[] = [];
  for (const item of row.items) {
    const product = byId.get(item.product_id);
    if (!product || isRetiredSku(product.sku)) continue;
    restored.push({
      productId: product.id,
      name: product.name,
      price: product.price_cents,
      quantity: item.quantity,
      ...(product.image_url ? { image: product.image_url } : {}),
      isPreorder: preorderOnlyMode || product.preorder_only,
      ...(product.preorder_deadline
        ? { preorderDeadline: product.preorder_deadline }
        : {}),
    });
  }
  return restored;
}
