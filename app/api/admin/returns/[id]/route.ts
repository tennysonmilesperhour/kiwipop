import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { returnUpdateSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

interface ReturnRow {
  id: string;
  order_id: string;
  status: string;
  refund_amount_cents: number;
}

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  stripe_payment_intent_id: string | null;
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
    parsed = returnUpdateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('returns')
    .select('id, order_id, status, refund_amount_cents')
    .eq('id', params.id)
    .maybeSingle<ReturnRow>();

  if (existingError) {
    return NextResponse.json(
      { error: 'Failed to load return', details: existingError.message },
      { status: 500 }
    );
  }
  if (!existing) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  const wantsRefund =
    parsed.process_refund === true ||
    (parsed.status === 'refunded' && existing.status !== 'refunded');

  let refundAmountCents =
    parsed.refund_amount_cents ?? existing.refund_amount_cents ?? 0;

  if (wantsRefund) {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_cents, stripe_payment_intent_id')
      .eq('id', existing.order_id)
      .maybeSingle<OrderRow>();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Failed to load order for refund' },
        { status: 500 }
      );
    }
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'Order has no payment intent — cannot refund via Stripe.' },
        { status: 409 }
      );
    }

    if (refundAmountCents <= 0) {
      refundAmountCents = order.total_cents;
    }
    if (refundAmountCents > order.total_cents) {
      return NextResponse.json(
        { error: 'Refund exceeds order total' },
        { status: 400 }
      );
    }

    try {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: refundAmountCents,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stripe error';
      return NextResponse.json(
        { error: 'Stripe refund failed', details: message },
        { status: 502 }
      );
    }

    await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.status !== undefined) updates.status = parsed.status;
  if (parsed.reason !== undefined) updates.reason = parsed.reason;
  if (parsed.refund_amount_cents !== undefined) {
    updates.refund_amount_cents = parsed.refund_amount_cents;
  } else if (wantsRefund) {
    updates.refund_amount_cents = refundAmountCents;
  }
  if (wantsRefund) {
    updates.status = 'refunded';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await supabaseAdmin
    .from('returns')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to update return', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ return: data });
}
