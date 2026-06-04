import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DEFAULT_ZONE_RADIUS_M, isValidLatLng } from '@/lib/map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

const PUBLIC_FIELDS =
  'id, label, kind, color, emoji, message, zone_lat, zone_lng, zone_radius_m, auto_off_on_exit, is_live, enabled, lat, lng, last_ping_at';

/**
 * GET — load a presence's config for the broadcaster page. Gated by knowing
 * the share token (a bearer secret). Never returns the token itself.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const { data, error } = await supabaseAdmin
    .from('live_presences')
    .select(PUBLIC_FIELDS)
    .eq('share_token', token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (!data.enabled) {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }

  return NextResponse.json({ presence: data });
}

/**
 * PATCH — operator self-service settings from their phone: toggle the
 * auto-off-on-exit behavior, update the "find me" message, or lock/clear the
 * broadcast zone to their current spot.
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const {
    auto_off_on_exit,
    message,
    zone_lat,
    zone_lng,
    zone_radius_m,
    clear_zone,
  } = body as {
    auto_off_on_exit?: boolean;
    message?: string;
    zone_lat?: number;
    zone_lng?: number;
    zone_radius_m?: number;
    clear_zone?: boolean;
  };

  const { data: presence, error: loadErr } = await supabaseAdmin
    .from('live_presences')
    .select('id, enabled')
    .eq('share_token', token)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!presence) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!presence.enabled) return NextResponse.json({ error: 'disabled' }, { status: 403 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof auto_off_on_exit === 'boolean') updates.auto_off_on_exit = auto_off_on_exit;
  if (message !== undefined) updates.message = message?.trim() || null;

  if (clear_zone) {
    updates.zone_lat = null;
    updates.zone_lng = null;
    updates.zone_radius_m = null;
  } else if (zone_lat !== undefined && zone_lng !== undefined) {
    if (!isValidLatLng(zone_lat, zone_lng)) {
      return NextResponse.json({ error: 'invalid zone coordinates' }, { status: 400 });
    }
    updates.zone_lat = zone_lat;
    updates.zone_lng = zone_lng;
    updates.zone_radius_m =
      typeof zone_radius_m === 'number' && zone_radius_m > 0
        ? Math.round(zone_radius_m)
        : DEFAULT_ZONE_RADIUS_M;
  } else if (typeof zone_radius_m === 'number' && zone_radius_m > 0) {
    updates.zone_radius_m = Math.round(zone_radius_m);
  }

  const { data, error } = await supabaseAdmin
    .from('live_presences')
    .update(updates)
    .eq('id', presence.id)
    .select(PUBLIC_FIELDS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'update failed' }, { status: 500 });
  }

  return NextResponse.json({ presence: data });
}
