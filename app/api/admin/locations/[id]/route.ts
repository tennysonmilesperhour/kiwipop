import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MARKER_COLOR_KEYS, isValidLatLng, type MarkerColor } from '@/lib/map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const KINDS = ['store', 'retail', 'popup', 'festival'] as const;

/** Admin PATCH — edit a fixed location. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof b.name === 'string') updates.name = b.name.trim();
  if (KINDS.includes(b.kind as (typeof KINDS)[number])) updates.kind = b.kind;
  if (MARKER_COLOR_KEYS.includes(b.color as MarkerColor)) updates.color = b.color;
  if (b.lat !== undefined && b.lng !== undefined) {
    if (!isValidLatLng(b.lat, b.lng)) {
      return NextResponse.json({ error: 'invalid lat/lng' }, { status: 400 });
    }
    updates.lat = b.lat;
    updates.lng = b.lng;
  }
  if (b.description !== undefined)
    updates.description = typeof b.description === 'string' ? b.description.trim() || null : null;
  if (b.address !== undefined)
    updates.address = typeof b.address === 'string' ? b.address.trim() || null : null;
  if (b.url !== undefined)
    updates.url = typeof b.url === 'string' ? b.url.trim() || null : null;
  if (typeof b.is_active === 'boolean') updates.is_active = b.is_active;
  if (b.starts_at !== undefined) updates.starts_at = b.starts_at || null;
  if (b.ends_at !== undefined) updates.ends_at = b.ends_at || null;

  const { data, error } = await supabaseAdmin
    .from('map_locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'update failed' }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}

/** Admin DELETE — remove a fixed location. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const { error } = await supabaseAdmin.from('map_locations').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
