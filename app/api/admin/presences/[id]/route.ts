import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MARKER_COLOR_KEYS, type MarkerColor } from '@/lib/map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const KINDS = ['rover', 'booth'] as const;

/**
 * Admin PATCH — edit a presence. The admin kill switch (`enabled`) and a hard
 * `is_live` toggle live here; the operator can't re-enable a disabled link.
 */
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

  if (typeof b.label === 'string') updates.label = b.label.trim();
  if (KINDS.includes(b.kind as (typeof KINDS)[number])) updates.kind = b.kind;
  if (MARKER_COLOR_KEYS.includes(b.color as MarkerColor)) updates.color = b.color;
  if (typeof b.emoji === 'string' && b.emoji.trim()) updates.emoji = b.emoji.trim();
  if (b.message !== undefined)
    updates.message = typeof b.message === 'string' ? b.message.trim() || null : null;
  if (typeof b.auto_off_on_exit === 'boolean') updates.auto_off_on_exit = b.auto_off_on_exit;
  if (typeof b.enabled === 'boolean') updates.enabled = b.enabled;
  if (typeof b.is_live === 'boolean') updates.is_live = b.is_live;
  if (b.zone_radius_m !== undefined)
    updates.zone_radius_m =
      typeof b.zone_radius_m === 'number' && b.zone_radius_m > 0
        ? Math.round(b.zone_radius_m)
        : null;
  if (b.clear_zone) {
    updates.zone_lat = null;
    updates.zone_lng = null;
    updates.zone_radius_m = null;
  }

  const { data, error } = await supabaseAdmin
    .from('live_presences')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'update failed' }, { status: 500 });
  }

  return NextResponse.json({ presence: data });
}

/** Admin DELETE — remove a presence (and invalidate its share link). */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const { error } = await supabaseAdmin.from('live_presences').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
