import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MARKER_COLOR_KEYS, isValidLatLng, type MarkerColor } from '@/lib/map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS = ['store', 'retail', 'popup', 'festival'] as const;

/** Admin GET — list all fixed map locations. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('map_locations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ locations: data ?? [] });
}

/** Admin POST — create a fixed map location. */
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
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const lat = b.lat;
  const lng = b.lng;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!isValidLatLng(lat, lng)) {
    return NextResponse.json({ error: 'valid lat/lng are required' }, { status: 400 });
  }

  const kind = KINDS.includes(b.kind as (typeof KINDS)[number])
    ? (b.kind as string)
    : 'retail';
  const color = MARKER_COLOR_KEYS.includes(b.color as MarkerColor)
    ? (b.color as string)
    : 'lime';

  const { data, error } = await supabaseAdmin
    .from('map_locations')
    .insert({
      name,
      kind,
      color,
      lat,
      lng,
      description: typeof b.description === 'string' ? b.description.trim() || null : null,
      address: typeof b.address === 'string' ? b.address.trim() || null : null,
      url: typeof b.url === 'string' ? b.url.trim() || null : null,
      is_active: typeof b.is_active === 'boolean' ? b.is_active : true,
      starts_at: b.starts_at || null,
      ends_at: b.ends_at || null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'failed to create', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ location: data }, { status: 201 });
}
