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

  interface MaterialRow {
    id: string;
    name: string;
    sku: string;
    unit: string;
    quantity_available: number;
  }
  const materials = (materialsRes.data ?? []) as MaterialRow[];
  const materialById = new Map(materials.map((m) => [m.id, m]));

  const producible = (producibleRes.data ?? []) as Array<{
    product_id: string;
    sku: string;
    name: string;
    producible: number;
  }>;

  // Per-flavor ingredient breakdown: how many pops each ingredient can support
  // (floor(stock / per-pop)). Lets the UI show *why* a flavor is capped.
  const flavorIds = producible.map((f) => f.product_id);
  const { data: bomRows } = await supabaseAdmin
    .from('bill_of_materials')
    .select('product_id, raw_material_id, quantity_per_unit')
    .in('product_id', flavorIds);

  type BreakdownLine = {
    materialId: string;
    name: string;
    sku: string;
    unit: string;
    perPop: number;
    stock: number;
    supported: number;
  };
  const breakdownByProduct = new Map<string, BreakdownLine[]>();
  for (const row of (bomRows ?? []) as Array<{
    product_id: string;
    raw_material_id: string;
    quantity_per_unit: number;
  }>) {
    const m = materialById.get(row.raw_material_id);
    if (!m) continue;
    const perPop = Number(row.quantity_per_unit);
    const stock = Number(m.quantity_available);
    const supported = perPop > 0 ? Math.floor(stock / perPop) : Infinity;
    const line: BreakdownLine = {
      materialId: m.id,
      name: m.name,
      sku: m.sku,
      unit: m.unit,
      perPop,
      stock,
      supported: Number.isFinite(supported) ? supported : 0,
    };
    const list = breakdownByProduct.get(row.product_id) ?? [];
    list.push(line);
    breakdownByProduct.set(row.product_id, list);
  }
  // Sort each flavor's ingredients by the tightest constraint first.
  for (const list of breakdownByProduct.values()) {
    list.sort((a, b) => a.supported - b.supported);
  }

  const flavors = producible
    .map((f) => ({
      ...f,
      low: f.producible < LOW_STOCK_POP_THRESHOLD,
      breakdown: breakdownByProduct.get(f.product_id) ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    materials,
    suppliers: suppliersRes.data ?? [],
    flavors,
    threshold: LOW_STOCK_POP_THRESHOLD,
  });
}
