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

  const { data, error } = await supabaseAdmin
    .from('raw_materials')
    .insert({
      name: parsed.name,
      sku: parsed.sku,
      quantity_available: parsed.quantity_available,
      quantity_reserved: parsed.quantity_reserved,
      reorder_point: parsed.reorder_point,
      supplier_id: parsed.supplier_id || null,
      last_restocked:
        parsed.quantity_available > 0 ? new Date().toISOString() : null,
    })
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
