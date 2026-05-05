import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { reconcilePendingOrdersWithStripe } from '@/lib/stripe-reconcile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 *
 * Query params:
 *   ?days=N   how many days of Stripe history to scan (default 60)
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const daysParam = url.searchParams.get('days');
  const lookbackDays = daysParam ? Number.parseInt(daysParam, 10) : undefined;

  const summary = await reconcilePendingOrdersWithStripe({
    lookbackDays:
      lookbackDays && Number.isFinite(lookbackDays) && lookbackDays > 0
        ? lookbackDays
        : undefined,
  });

  return NextResponse.json({ ok: true, summary });
}
