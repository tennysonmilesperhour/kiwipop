import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const slug = request.nextUrl.searchParams.get('slug') ?? 'artwork-001';

  const { data, error } = await supabaseAdmin
    .from('raffle_entries')
    .select(
      'id, raffle_slug, name, email, phone, social_handle, source, is_winner, won_at, created_at',
    )
    .eq('raffle_slug', slug)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'failed to load entries', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    slug,
    count: data?.length ?? 0,
    winners: data?.filter((e) => e.is_winner) ?? [],
    entries: data ?? [],
  });
}
