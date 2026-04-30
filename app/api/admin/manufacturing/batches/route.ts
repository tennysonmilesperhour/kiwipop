import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { batchCreateSchema } from '@/lib/validators';

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
    parsed = batchCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const insert = {
    batch_number: parsed.batch_number,
    product_id: parsed.product_id,
    quantity_ordered: parsed.quantity_ordered,
    quantity_completed: 0,
    supplier_id: parsed.supplier_id || null,
    status: parsed.status,
    order_date: parsed.order_date || null,
    expected_delivery: parsed.expected_delivery || null,
    cost_cents: parsed.cost_cents,
    notes: parsed.notes || null,
  };

  const { data, error } = await supabaseAdmin
    .from('manufacturing_batches')
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create batch', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ batch: data }, { status: 201 });
}
