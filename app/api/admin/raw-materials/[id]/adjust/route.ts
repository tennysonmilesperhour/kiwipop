import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rawMaterialAdjustSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * Manually adjust a raw material's stock by a signed delta and log it. A
 * negative delta removes stock (waste, spoilage, reconciling to a physical
 * recount); a positive delta adds it. Stock is floored at 0, so removing more
 * than is on hand simply zeroes it out.
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
    parsed = rawMaterialAdjustSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const note =
    typeof parsed.note === 'string' && parsed.note.trim() ? parsed.note.trim() : null;

  const { data: newQuantity, error: rpcError } = await supabaseAdmin.rpc(
    'adjust_raw_material_stock',
    {
      p_material_id: params.id,
      p_delta: parsed.delta,
      p_note: note,
      p_actor: auth.userId,
    }
  );

  if (rpcError) {
    const notFound = /raw material not found/i.test(rpcError.message);
    return NextResponse.json(
      { error: notFound ? 'Raw material not found' : 'Failed to adjust stock', details: rpcError.message },
      { status: notFound ? 404 : 500 }
    );
  }

  const { data: updated } = await supabaseAdmin
    .from('raw_materials')
    .select('*')
    .eq('id', params.id)
    .single();

  return NextResponse.json({
    rawMaterial: updated,
    delta: parsed.delta,
    quantityAvailable: newQuantity,
  });
}
