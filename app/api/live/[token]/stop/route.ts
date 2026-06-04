import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

/** POST — operator taps "go offline". Flips the presence off immediately. */
export async function POST(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const { data, error } = await supabaseAdmin
    .from('live_presences')
    .update({ is_live: false, updated_at: new Date().toISOString() })
    .eq('share_token', token)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ is_live: false });
}
