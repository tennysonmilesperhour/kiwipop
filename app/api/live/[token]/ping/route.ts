import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LIVE_FRESH_SECONDS, distanceMeters, isValidLatLng } from '@/lib/map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

/**
 * POST — heartbeat from the operator's phone. Updates the live position and
 * keeps the presence "fresh". Enforces the geofence: if a zone is set,
 * auto_off_on_exit is on, and the operator is outside the radius, the presence
 * is flipped off and `left_zone` is returned so the client stops broadcasting.
 *
 * Body: { lat: number, lng: number, accuracy_m?: number }
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { lat, lng, accuracy_m } = body as {
    lat?: number;
    lng?: number;
    accuracy_m?: number;
  };

  if (!isValidLatLng(lat, lng)) {
    return NextResponse.json({ error: 'invalid coordinates' }, { status: 400 });
  }

  const { data: presence, error: loadErr } = await supabaseAdmin
    .from('live_presences')
    .select('id, enabled, zone_lat, zone_lng, zone_radius_m, auto_off_on_exit')
    .eq('share_token', token)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!presence) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!presence.enabled) return NextResponse.json({ error: 'disabled' }, { status: 403 });

  // Geofence check
  let leftZone = false;
  if (
    presence.auto_off_on_exit &&
    presence.zone_lat != null &&
    presence.zone_lng != null &&
    presence.zone_radius_m != null
  ) {
    const dist = distanceMeters(lat!, lng!, presence.zone_lat, presence.zone_lng);
    if (dist > presence.zone_radius_m) leftZone = true;
  }

  const { error: updErr } = await supabaseAdmin
    .from('live_presences')
    .update({
      lat,
      lng,
      accuracy_m: typeof accuracy_m === 'number' ? accuracy_m : null,
      last_ping_at: new Date().toISOString(),
      // Leaving the zone auto-hides the pin; staying keeps it live.
      is_live: !leftZone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', presence.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    is_live: !leftZone,
    left_zone: leftZone,
    fresh_seconds: LIVE_FRESH_SECONDS,
  });
}
