import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { orderStatusSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: orderStatusSchema,
});

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  stripe_payment_intent_id: string | null;
}

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = patchSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_cents, stripe_payment_intent_id')
    .eq('id', params.id)
    .maybeSingle<OrderRow>();

  if (orderError) {
    return NextResponse.json(
      { error: 'Failed to load order', details: orderError.message },
      { status: 500 }
    );
  }
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const movingToCancelled =
    parsed.status === 'cancelled' &&
    order.status === 'paid' &&
    order.stripe_payment_intent_id;

  if (movingToCancelled && order.stripe_payment_intent_id) {
    try {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stripe refund failed';
      return NextResponse.json(
        { error: 'Refund failed', details: message },
        { status: 502 }
      );
    }

    await supabaseAdmin.from('returns').insert({
      order_id: order.id,
      reason: 'Admin cancelled paid order',
      status: 'refunded',
      refund_amount_cents: order.total_cents,
    });
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update order', details: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, status: parsed.status });
}
