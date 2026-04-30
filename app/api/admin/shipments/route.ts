import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { shipmentCreateSchema } from '@/lib/validators';

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
    parsed = shipmentCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  // Confirm the order exists and is paid (or shipped already, e.g. retroactive entry)
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status')
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

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('shipments')
    .insert({
      order_id: parsed.order_id,
      carrier: parsed.carrier,
      tracking_number: parsed.tracking_number,
      label_url: parsed.label_url || null,
      shipped_at: now,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create shipment', details: error?.message },
      { status: 500 }
    );
  }

  // Move order to 'shipped' if not already.
  if (order.status === 'paid') {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'shipped', updated_at: now })
      .eq('id', parsed.order_id);
  }

  return NextResponse.json({ shipment: data }, { status: 201 });
}
