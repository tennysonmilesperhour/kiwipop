import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rawMaterialRestockSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

interface MaterialRow {
  id: string;
  reference_url: string | null;
  pack_weight: number | null;
  pack_price_cents: number | null;
  wholesale_url: string | null;
  wholesale_pack_weight: number | null;
  wholesale_pack_price_cents: number | null;
}

/**
 * Restock a raw material: add weight to stock and log the cost.
 *  • source "retail" / "wholesale" → use the saved pack preset (weight + price
 *    + reference link) unless an explicit quantity/cost is provided.
 *  • source "manual" → use the provided quantity + cost.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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
    parsed = rawMaterialRestockSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const { data: material, error: loadError } = await supabaseAdmin
    .from('raw_materials')
    .select(
      'id, reference_url, pack_weight, pack_price_cents, wholesale_url, wholesale_pack_weight, wholesale_pack_price_cents'
    )
    .eq('id', params.id)
    .maybeSingle<MaterialRow>();

  if (loadError || !material) {
    return NextResponse.json({ error: 'Raw material not found' }, { status: 404 });
  }

  let quantity = parsed.quantityAdded ?? null;
  let costCents = parsed.costCents ?? null;
  let referenceUrl =
    (typeof parsed.referenceUrl === 'string' && parsed.referenceUrl) || null;

  if (parsed.source === 'retail') {
    quantity = quantity ?? material.pack_weight;
    costCents = costCents ?? material.pack_price_cents;
    referenceUrl = referenceUrl ?? material.reference_url;
  } else if (parsed.source === 'wholesale') {
    quantity = quantity ?? material.wholesale_pack_weight;
    costCents = costCents ?? material.wholesale_pack_price_cents;
    referenceUrl = referenceUrl ?? material.wholesale_url;
  }

  if (quantity === null || quantity <= 0) {
    return NextResponse.json(
      {
        error:
          parsed.source === 'manual'
            ? 'A quantity is required for a manual restock.'
            : `No ${parsed.source} pack preset saved for this material. Set one or restock manually.`,
      },
      { status: 400 }
    );
  }

  const { error: rpcError } = await supabaseAdmin.rpc('restock_raw_material', {
    p_material_id: params.id,
    p_quantity: quantity,
    p_cost_cents: costCents ?? 0,
    p_source: parsed.source,
    p_reference_url: referenceUrl,
    p_actor: auth.userId,
  });

  if (rpcError) {
    return NextResponse.json(
      { error: 'Failed to restock', details: rpcError.message },
      { status: 500 }
    );
  }

  const { data: updated } = await supabaseAdmin
    .from('raw_materials')
    .select('*')
    .eq('id', params.id)
    .single();

  return NextResponse.json({ rawMaterial: updated, added: quantity, costCents: costCents ?? 0 });
}
