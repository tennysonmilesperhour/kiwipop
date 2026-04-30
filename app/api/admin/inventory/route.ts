import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { inventoryAdjustSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
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
    parsed = inventoryAdjustSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const now = new Date().toISOString();

  const { error: invError } = await supabaseAdmin.from('inventory').upsert(
    {
      product_id: parsed.productId,
      quantity_available: parsed.quantityAvailable,
      quantity_reserved: parsed.quantityReserved ?? 0,
      quantity_preordered: parsed.quantityPreordered ?? 0,
      last_updated: now,
    },
    { onConflict: 'product_id' }
  );

  if (invError) {
    return NextResponse.json(
      { error: 'Failed to update inventory', details: invError.message },
      { status: 500 }
    );
  }

  // Keep products.in_stock display column in sync.
  const { error: prodError } = await supabaseAdmin
    .from('products')
    .update({ in_stock: parsed.quantityAvailable })
    .eq('id', parsed.productId);

  if (prodError) {
    return NextResponse.json(
      {
        error: 'Failed to sync product stock',
        details: prodError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
