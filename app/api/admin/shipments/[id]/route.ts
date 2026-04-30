import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { shipmentUpdateSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    parsed = shipmentUpdateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined) continue;
    updates[key] = value === '' ? null : value;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .update(updates)
    .eq('id', params.id)
    .select('*, orders(id, status)')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to update shipment', details: error?.message },
      { status: 500 }
    );
  }

  // If marking delivered, advance order to 'completed'.
  if (
    typeof updates.delivered_at === 'string' &&
    data.orders?.id &&
    data.orders.status === 'shipped'
  ) {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', data.orders.id);
  }

  return NextResponse.json({ shipment: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { error } = await supabaseAdmin
    .from('shipments')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete shipment', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
