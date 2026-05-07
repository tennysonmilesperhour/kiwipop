import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get('status') ?? 'pending';

  let query = supabaseAdmin
    .from('reviews')
    .select(
      'id, display_name, email, rating, body, status, source, created_at, approved_at, rejected_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'failed to load reviews', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ reviews: data ?? [] });
}
