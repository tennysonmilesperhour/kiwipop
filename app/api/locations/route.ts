import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  LIVE_FRESH_SECONDS,
  resolveColor,
  type MapPoint,
} from '@/lib/map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public map feed. Returns every fixed location plus any live presence that is
 * flagged live AND was pinged within LIVE_FRESH_SECONDS. share_token is never
 * selected here — it's a secret.
 */
export async function GET() {
  const now = Date.now();
  const freshCutoff = new Date(now - LIVE_FRESH_SECONDS * 1000).toISOString();

  const [locationsRes, liveRes] = await Promise.all([
    supabaseAdmin
      .from('map_locations')
      .select('id, name, kind, description, address, lat, lng, url, color')
      .eq('is_active', true),
    supabaseAdmin
      .from('live_presences')
      .select('id, label, kind, color, emoji, message, lat, lng, last_ping_at')
      .eq('enabled', true)
      .eq('is_live', true)
      .gte('last_ping_at', freshCutoff)
      .not('lat', 'is', null)
      .not('lng', 'is', null),
  ]);

  if (locationsRes.error) {
    return NextResponse.json({ error: locationsRes.error.message }, { status: 500 });
  }
  if (liveRes.error) {
    return NextResponse.json({ error: liveRes.error.message }, { status: 500 });
  }

  const points: MapPoint[] = [];

  for (const l of locationsRes.data ?? []) {
    points.push({
      id: l.id,
      source: 'location',
      name: l.name,
      kind: l.kind,
      lat: l.lat,
      lng: l.lng,
      color: resolveColor(l.color),
      description: l.description,
      address: l.address,
      url: l.url,
      live: false,
    });
  }

  for (const p of liveRes.data ?? []) {
    const lastSeenMinutes = p.last_ping_at
      ? Math.max(0, Math.round((now - new Date(p.last_ping_at).getTime()) / 60000))
      : null;
    points.push({
      id: p.id,
      source: 'live',
      name: p.label,
      kind: p.kind,
      lat: p.lat,
      lng: p.lng,
      color: resolveColor(p.color),
      emoji: p.emoji,
      description: p.message,
      live: true,
      lastSeenMinutes,
    });
  }

  return NextResponse.json({ points });
}
