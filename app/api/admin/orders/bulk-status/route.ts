import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { consumeIngredientsForOrder, checkAndAlertLowStock } from '@/lib/inventory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(100),
  // Restricted set — bulk cancel triggers Stripe refunds and that needs to
  // happen one at a time through the existing single-order endpoint, so
  // it's intentionally not allowed here.
  status: z.enum(['paid', 'shipped', 'completed']),
});

/**
 * Bulk status flip for orders that don't need Stripe-side side effects
 * (paid → shipped, shipped → completed, etc.). Cancellations are
 * intentionally excluded — those need to go one-by-one through
 * `/api/admin/orders/[id]` so each Stripe refund is auditable.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { orderIds, status } = parsed.data;

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', orderIds);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update orders', details: error.message },
      { status: 500 },
    );
  }

  // Marking orders fulfilled (shipped/completed) deducts their ingredients from
  // raw-material stock. Idempotent per order at the DB level, so re-runs and the
  // shipped → completed progression never double-deduct. Best-effort: failures
  // are logged, never surfaced as a 500, so the status flip still succeeds.
  if (status === 'shipped' || status === 'completed') {
    for (const id of orderIds) {
      // eslint-disable-next-line no-await-in-loop
      await consumeIngredientsForOrder(id);
    }
    await checkAndAlertLowStock();
  }

  return NextResponse.json({ ok: true, updated: orderIds.length, status });
}
