import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rawMaterialCreateSchema } from '@/lib/validators';

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
    parsed = rawMaterialCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const insertRow: Record<string, unknown> = {
    name: parsed.name,
    sku: parsed.sku,
    quantity_available: parsed.quantity_available,
    quantity_reserved: parsed.quantity_reserved,
    reorder_point: parsed.reorder_point,
    supplier_id: parsed.supplier_id || null,
    last_restocked:
      parsed.quantity_available > 0 ? new Date().toISOString() : null,
  };

  // Optional ingredient-tracking fields (unit, cost, restock presets/links).
  const optionalKeys = [
    'unit',
    'cost_per_unit_cents',
    'reference_url',
    'pack_weight',
    'pack_price_cents',
    'wholesale_url',
    'wholesale_pack_weight',
    'wholesale_pack_price_cents',
  ] as const;
  for (const key of optionalKeys) {
    const value = (parsed as Record<string, unknown>)[key];
    if (value !== undefined) insertRow[key] = value === '' ? null : value;
  }

  const { data, error } = await supabaseAdmin
    .from('raw_materials')
    .insert(insertRow)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create raw material', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ rawMaterial: data }, { status: 201 });
}
