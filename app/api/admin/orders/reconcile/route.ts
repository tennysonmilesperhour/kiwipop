import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PendingOrderRow {
  id: string;
  status: string;
  total_cents: number;
  user_email: string | null;
  created_at: string;
}

interface ReconcileSummary {
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

/**
 * Pull recent Stripe Checkout Sessions and reconcile their `payment_status`
 * back into our `orders` table for any rows still stuck in `pending`. This
 * is the manual safety net for when the Stripe webhook (`/api/webhooks/stripe`)
 * isn't firing in production — admins can hit this endpoint to flip orders
 * that actually paid in Stripe but never got their `paid` status updated
 * locally.
 *
 * Safe to run repeatedly. Only updates orders whose current status is
 * `pending`. `paid` / `shipped` / `completed` / `cancelled` are left alone.
 */
export async function POST() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // 1. Fetch the orders we still need answers for. Anything not pending is
  //    already settled locally — don't second-guess it.
  const { data: pendingOrders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_cents, user_email, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .returns<PendingOrderRow[]>();

  if (ordersError) {
    return NextResponse.json(
      { error: 'failed to load pending orders', details: ordersError.message },
      { status: 500 },
    );
  }

  const pendingByOrderId = new Map<string, PendingOrderRow>();
  for (const o of pendingOrders ?? []) pendingByOrderId.set(o.id, o);

  const summary: ReconcileSummary = {
    scanned_sessions: 0,
    pending_orders_before: pendingByOrderId.size,
    matched: 0,
    marked_paid: 0,
    marked_cancelled: 0,
    errors: [],
    changes: [],
  };

  if (pendingByOrderId.size === 0) {
    return NextResponse.json({ ok: true, summary });
  }

  // 2. Page through recent Checkout Sessions. We use 7d worth (200 sessions
  //    typically covers a launch's first weekend); admins can rerun if older
  //    orders need to be reconciled.
  const sevenDaysAgoSeconds = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  let starting_after: string | undefined;
  let pagesScanned = 0;
  const MAX_PAGES = 5; // 5 × 100 = 500 sessions

  while (pagesScanned < MAX_PAGES) {
    let page: Stripe.ApiList<Stripe.Checkout.Session>;
    try {
      page = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: sevenDaysAgoSeconds },
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

      // Stripe payment_status: 'paid' / 'unpaid' / 'no_payment_required'.
      // session.status: 'open' / 'complete' / 'expired'.
      const paid =
        session.payment_status === 'paid' ||
        session.payment_status === 'no_payment_required';
      const expiredOrCancelled = session.status === 'expired';

      if (paid) {
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: paymentIntentId,
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
      // Sessions still 'open' are left alone — customer may still be paying.
    }

    pagesScanned++;
    if (!page.has_more || page.data.length === 0) break;
    starting_after = page.data[page.data.length - 1]?.id;
    if (!starting_after) break;
  }

  return NextResponse.json({ ok: true, summary });
}
