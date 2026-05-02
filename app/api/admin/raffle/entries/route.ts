import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { decodeRaffleSource, RAFFLE_SOURCE_PREFIX } from '@/lib/raffle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PG_UNDEFINED_TABLE = '42P01';

interface UnifiedEntry {
  id: string;
  raffle_slug: string;
  name: string;
  email: string;
  phone: string | null;
  social_handle: string | null;
  source: string;
  is_winner: boolean;
  won_at: string | null;
  created_at: string;
  storage: 'raffle_entries' | 'email_signups_fallback';
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const slug = request.nextUrl.searchParams.get('slug') ?? 'artwork-001';

  const entries: UnifiedEntry[] = [];
  let primaryAvailable = true;
  let fallbackUsed = false;

  // Primary: raffle_entries (only present after migration 009).
  const primary = await supabaseAdmin
    .from('raffle_entries')
    .select(
      'id, raffle_slug, name, email, phone, social_handle, source, is_winner, won_at, created_at',
    )
    .eq('raffle_slug', slug)
    .order('created_at', { ascending: false });

  if (primary.error) {
    const isMissingTable =
      primary.error.code === PG_UNDEFINED_TABLE ||
      /relation .*raffle_entries.* does not exist/i.test(primary.error.message);

    if (!isMissingTable) {
      return NextResponse.json(
        { error: 'failed to load entries', details: primary.error.message },
        { status: 500 },
      );
    }
    primaryAvailable = false;
  } else if (primary.data) {
    for (const row of primary.data) {
      entries.push({ ...row, storage: 'raffle_entries' });
    }
  }

  // Always also load fallback rows from email_signups so entries captured
  // before migration 009 lands aren't lost. Filter on the source prefix and
  // decode the encoded payload back into name/phone/social.
  const fallback = await supabaseAdmin
    .from('email_signups')
    .select('id, email, source, ip_address, user_agent, created_at')
    .like('source', `${RAFFLE_SOURCE_PREFIX}%`)
    .order('created_at', { ascending: false });

  if (fallback.error) {
    return NextResponse.json(
      { error: 'failed to load fallback entries', details: fallback.error.message },
      { status: 500 },
    );
  }

  for (const row of fallback.data ?? []) {
    const decoded = decodeRaffleSource(row.source);
    if (!decoded || decoded.slug !== slug) continue;
    fallbackUsed = true;
    entries.push({
      id: row.id,
      raffle_slug: decoded.slug,
      name: decoded.name,
      email: row.email,
      phone: decoded.phone ?? null,
      social_handle: decoded.social_handle ?? null,
      source: decoded.origin,
      is_winner: false,
      won_at: null,
      created_at: row.created_at,
      storage: 'email_signups_fallback',
    });
  }

  // Sort newest first across both surfaces.
  entries.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return NextResponse.json({
    slug,
    count: entries.length,
    winners: entries.filter((e) => e.is_winner),
    entries,
    storage: {
      primary_available: primaryAvailable,
      fallback_used: fallbackUsed,
      migration_pending: !primaryAvailable,
    },
  });
}
