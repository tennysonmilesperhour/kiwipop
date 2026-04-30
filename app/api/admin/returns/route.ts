import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { returnCreateSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    parsed = returnCreateSchema.parse(body);
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
    .select('id, total_cents')
    .eq('id', parsed.order_id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json(
      { error: 'Failed to verify order', details: orderError.message },
      { status: 500 }
    );
  }
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const refundAmount =
    parsed.refund_amount_cents === 0
      ? order.total_cents
      : parsed.refund_amount_cents;

  const { data, error } = await supabaseAdmin
    .from('returns')
    .insert({
      order_id: parsed.order_id,
      reason: parsed.reason,
      status: parsed.status,
      refund_amount_cents: refundAmount,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create return', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ return: data }, { status: 201 });
}
