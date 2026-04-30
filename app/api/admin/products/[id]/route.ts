import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { productUpdateSchema } from '@/lib/validators';

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
    parsed = productUpdateSchema.parse(body);
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

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !product) {
    return NextResponse.json(
      { error: 'Failed to update product', details: error?.message },
      { status: 500 }
    );
  }

  if (typeof updates.in_stock === 'number') {
    await supabaseAdmin
      .from('inventory')
      .upsert(
        {
          product_id: params.id,
          quantity_available: updates.in_stock as number,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'product_id' }
      );
  }

  return NextResponse.json({ product });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // Refuse delete if there are order_items referencing this product —
  // protects historical order integrity.
  const { count, error: countError } = await supabaseAdmin
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', params.id);

  if (countError) {
    return NextResponse.json(
      { error: 'Failed to check references', details: countError.message },
      { status: 500 }
    );
  }
  if (count && count > 0) {
    return NextResponse.json(
      {
        error:
          'Cannot delete product with order history. Mark it out of stock instead.',
      },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
