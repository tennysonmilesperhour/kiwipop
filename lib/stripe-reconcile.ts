import 'server-only';

import type Stripe from 'stripe';
import { stripe } from './stripe';
import { supabaseAdmin } from './supabase-admin';

interface PendingOrderRow {
  id: string;
  status: string;
  total_cents: number;
  user_email: string | null;
  created_at: string;
}

export interface ReconcileSummary {
  scanned_sessions: number;
  pending_orders_before: number;
  matched: number;
  marked_paid: number;
  marked_cancelled: number;
  errors: string[];
  changes: Array<{
    order_id: string;
    new_status: string;
    payment_intent_id: string | null;
  }>;
}

interface ReconcileOptions {
  /**
   * How many days back to scan Stripe Checkout Sessions. Defaults to a
   * lookback that covers since the storefront launch (60 days) so historical
   * paid orders that never got their webhook are still recovered.
   */
  lookbackDays?: number;
  /**
   * Cap on the number of 100-session pages to fetch. Each page is one
   * Stripe API call.
   */
  maxPages?: number;
}

/**
 * Pull Stripe Checkout Sessions and flip locally-`pending` orders to `paid`
 * (or `cancelled`) based on what actually happened on Stripe. Used both by
 * the admin "reconcile now" button and by the financials summary endpoint
 * so dashboards self-heal when the webhook isn't firing.
 */
export async function reconcilePendingOrdersWithStripe(
  options: ReconcileOptions = {},
): Promise<ReconcileSummary> {
  const lookbackDays = options.lookbackDays ?? 60;
  const maxPages = options.maxPages ?? 20;

  const { data: pendingOrders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_cents, user_email, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .returns<PendingOrderRow[]>();

  const summary: ReconcileSummary = {
    scanned_sessions: 0,
    pending_orders_before: 0,
    matched: 0,
    marked_paid: 0,
    marked_cancelled: 0,
    errors: [],
    changes: [],
  };

  if (ordersError) {
    summary.errors.push(`load pending: ${ordersError.message}`);
    return summary;
  }

  const pendingByOrderId = new Map<string, PendingOrderRow>();
  for (const o of pendingOrders ?? []) pendingByOrderId.set(o.id, o);
  summary.pending_orders_before = pendingByOrderId.size;

  if (pendingByOrderId.size === 0) return summary;

  const sinceSeconds =
    Math.floor(Date.now() / 1000) - lookbackDays * 24 * 60 * 60;
  let starting_after: string | undefined;
  let pagesScanned = 0;

  while (pagesScanned < maxPages) {
    let page: Stripe.ApiList<Stripe.Checkout.Session>;
    try {
      page = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: sinceSeconds },
        ...(starting_after ? { starting_after } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'stripe list failed';
      summary.errors.push(`stripe list page ${pagesScanned}: ${message}`);
      break;
    }

    for (const session of page.data) {
      summary.scanned_sessions++;
      const orderId = session.metadata?.orderId;
      if (!orderId) continue;
      const pending = pendingByOrderId.get(orderId);
      if (!pending) continue;
      summary.matched++;

      const paid =
        session.payment_status === 'paid' ||
        session.payment_status === 'no_payment_required';
      const expiredOrCancelled = session.status === 'expired';

      if (paid) {
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
        const amountTotal =
          typeof session.amount_total === 'number'
            ? session.amount_total
            : null;

        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: paymentIntentId,
            ...(amountTotal !== null ? { total_cents: amountTotal } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'pending');

        if (error) {
          summary.errors.push(`update ${orderId}: ${error.message}`);
        } else {
          summary.marked_paid++;
          summary.changes.push({
            order_id: orderId,
            new_status: 'paid',
            payment_intent_id: paymentIntentId,
          });
          pendingByOrderId.delete(orderId);
        }
      } else if (expiredOrCancelled) {
        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'pending');

        if (error) {
          summary.errors.push(`cancel ${orderId}: ${error.message}`);
        } else {
          summary.marked_cancelled++;
          summary.changes.push({
            order_id: orderId,
            new_status: 'cancelled',
            payment_intent_id: null,
          });
          pendingByOrderId.delete(orderId);
        }
      }
    }

    pagesScanned++;
    if (!page.has_more || page.data.length === 0) break;
    starting_after = page.data[page.data.length - 1]?.id;
    if (!starting_after) break;
  }

  return summary;
}

export interface StripeFinancialTotals {
  /** Sum of succeeded charge amounts in cents. */
  grossCents: number;
  /** Sum of refunded amounts in cents (across succeeded charges). */
  refundedCents: number;
  /** grossCents - refundedCents — what actually settled to the business. */
  netCents: number;
  chargeCount: number;
  refundedChargeCount: number;
  /** Earliest charge timestamp (ms epoch) seen during the scan, or null. */
  earliestChargeMs: number | null;
  /** Latest charge timestamp (ms epoch) seen during the scan, or null. */
  latestChargeMs: number | null;
  errors: string[];
}

/**
 * Pull every succeeded Stripe charge (across all time, paginated) and sum
 * gross + refunded. This is the source of truth for "money actually
 * collected" — it doesn't depend on whether our webhook fired.
 */
export async function loadStripeFinancialTotals(): Promise<StripeFinancialTotals> {
  const totals: StripeFinancialTotals = {
    grossCents: 0,
    refundedCents: 0,
    netCents: 0,
    chargeCount: 0,
    refundedChargeCount: 0,
    earliestChargeMs: null,
    latestChargeMs: null,
    errors: [],
  };

  let starting_after: string | undefined;
  const MAX_PAGES = 50; // 50 × 100 = 5000 charges

  for (let page = 0; page < MAX_PAGES; page++) {
    let resp: Stripe.ApiList<Stripe.Charge>;
    try {
      resp = await stripe.charges.list({
        limit: 100,
        ...(starting_after ? { starting_after } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'stripe list failed';
      totals.errors.push(`charges page ${page}: ${message}`);
      break;
    }

    for (const charge of resp.data) {
      if (charge.status !== 'succeeded') continue;
      totals.chargeCount++;
      totals.grossCents += charge.amount;
      const refunded = charge.amount_refunded ?? 0;
      if (refunded > 0) {
        totals.refundedCents += refunded;
        totals.refundedChargeCount++;
      }
      const createdMs = charge.created * 1000;
      if (totals.earliestChargeMs === null || createdMs < totals.earliestChargeMs) {
        totals.earliestChargeMs = createdMs;
      }
      if (totals.latestChargeMs === null || createdMs > totals.latestChargeMs) {
        totals.latestChargeMs = createdMs;
      }
    }

    if (!resp.has_more || resp.data.length === 0) break;
    starting_after = resp.data[resp.data.length - 1]?.id;
    if (!starting_after) break;
  }

  totals.netCents = totals.grossCents - totals.refundedCents;
  return totals;
}
