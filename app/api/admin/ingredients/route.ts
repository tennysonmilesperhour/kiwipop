import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LOW_STOCK_POP_THRESHOLD } from '@/lib/inventory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin ingredient dashboard data: every raw material (with stock, unit, cost,
 * restock presets) plus how many pops of each flavor we can still produce,
 * flagged against the low-stock threshold.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const [materialsRes, producibleRes, suppliersRes] = await Promise.all([
    supabaseAdmin.from('raw_materials').select('*').order('name'),
    supabaseAdmin.rpc('producible_pops_by_flavor'),
    supabaseAdmin.from('suppliers').select('id, name').order('name'),
  ]);

  if (materialsRes.error) {
    return NextResponse.json(
      { error: 'Failed to load raw materials', details: materialsRes.error.message },
      { status: 500 }
    );
  }

  const flavors = ((producibleRes.data ?? []) as Array<{
    product_id: string;
    sku: string;
    name: string;
    producible: number;
  }>)
    .map((f) => ({ ...f, low: f.producible < LOW_STOCK_POP_THRESHOLD }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    materials: materialsRes.data ?? [],
    suppliers: suppliersRes.data ?? [],
    flavors,
    threshold: LOW_STOCK_POP_THRESHOLD,
  });
}
