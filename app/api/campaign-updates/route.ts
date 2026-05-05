import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public GET — returns the update feed, newest first. */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('campaign_updates')
    .select('id, title, body, image_url, is_milestone, milestone_label, published_at')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updates: data ?? [] });
}
