import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rawMaterialUpdateSchema } from '@/lib/validators';

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
    parsed = rawMaterialUpdateSchema.parse(body);
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

  if (
    typeof updates.quantity_available === 'number' &&
    updates.quantity_available > 0
  ) {
    updates.last_restocked = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('raw_materials')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to update raw material', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ rawMaterial: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { error } = await supabaseAdmin
    .from('raw_materials')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete raw material', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
