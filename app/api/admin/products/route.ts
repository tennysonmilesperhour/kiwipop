import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { productCreateSchema } from '@/lib/validators';

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
    parsed = productCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const insertRow = {
    name: parsed.name,
    description: parsed.description || null,
    sku: parsed.sku,
    price_cents: parsed.price_cents,
    preorder_only: parsed.preorder_only,
    preorder_deadline: parsed.preorder_deadline || null,
    in_stock: parsed.in_stock,
    image_url: parsed.image_url || null,
  };

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert(insertRow)
    .select()
    .single();

  if (error || !product) {
    return NextResponse.json(
      { error: 'Failed to create product', details: error?.message },
      { status: 500 }
    );
  }

  // Seed inventory row at 0/0/0
  await supabaseAdmin.from('inventory').upsert(
    {
      product_id: product.id,
      quantity_available: parsed.in_stock,
      quantity_reserved: 0,
      quantity_preordered: 0,
      last_updated: new Date().toISOString(),
    },
    { onConflict: 'product_id' }
  );

  return NextResponse.json({ product }, { status: 201 });
}
