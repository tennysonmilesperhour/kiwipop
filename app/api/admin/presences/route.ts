import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  DEFAULT_ZONE_RADIUS_M,
  MARKER_COLOR_KEYS,
  isValidLatLng,
  type MarkerColor,
} from '@/lib/map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS = ['rover', 'booth'] as const;

/** Admin GET — list all live presences (includes share_token for link copy). */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('live_presences')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ presences: data ?? [] });
}

/** Admin POST — create a live presence and mint its share token. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const label = typeof b.label === 'string' ? b.label.trim() : '';
  if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 });

  const kind = KINDS.includes(b.kind as (typeof KINDS)[number]) ? (b.kind as string) : 'rover';
  const color = MARKER_COLOR_KEYS.includes(b.color as MarkerColor)
    ? (b.color as string)
    : 'magenta';

  const insert: Record<string, unknown> = {
    label,
    kind,
    color,
    // No default star: the map marker is already a star, so defaulting to '⭐'
    // double-renders. Leave it null unless the operator picks a real badge.
    emoji: typeof b.emoji === 'string' && b.emoji.trim() ? b.emoji.trim() : null,
    message: typeof b.message === 'string' ? b.message.trim() || null : null,
    auto_off_on_exit: typeof b.auto_off_on_exit === 'boolean' ? b.auto_off_on_exit : true,
    created_by: auth.userId,
  };

  // Optional pre-set zone
  if (b.zone_lat !== undefined && b.zone_lng !== undefined) {
    if (!isValidLatLng(b.zone_lat, b.zone_lng)) {
      return NextResponse.json({ error: 'invalid zone coordinates' }, { status: 400 });
    }
    insert.zone_lat = b.zone_lat;
    insert.zone_lng = b.zone_lng;
    insert.zone_radius_m =
      typeof b.zone_radius_m === 'number' && b.zone_radius_m > 0
        ? Math.round(b.zone_radius_m)
        : DEFAULT_ZONE_RADIUS_M;
  }

  const { data, error } = await supabaseAdmin
    .from('live_presences')
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'failed to create', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ presence: data }, { status: 201 });
}
