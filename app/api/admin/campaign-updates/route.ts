import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin GET — list all campaign updates. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('campaign_updates')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updates: data ?? [] });
}

/** Admin POST — create a new campaign update. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { title, body: updateBody, image_url, is_milestone, milestone_label } = body as {
    title?: string;
    body?: string;
    image_url?: string;
    is_milestone?: boolean;
    milestone_label?: string;
  };

  if (!title?.trim() || !updateBody?.trim()) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('campaign_updates')
    .insert({
      title: title.trim(),
      body: updateBody.trim(),
      image_url: image_url?.trim() || null,
      is_milestone: is_milestone ?? false,
      milestone_label: milestone_label?.trim() || null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'failed to create update', details: error?.message },
      { status: 500 },
    );
  }

  revalidatePath('/campaign');
  return NextResponse.json({ update: data }, { status: 201 });
}
