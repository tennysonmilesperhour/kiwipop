import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Admin DELETE — remove a campaign update. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const { error } = await supabaseAdmin
    .from('campaign_updates')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/campaign');
  return NextResponse.json({ deleted: true });
}

/** Admin PATCH — update a campaign update. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title.trim();
  if (updateBody !== undefined) updates.body = updateBody.trim();
  if (image_url !== undefined) updates.image_url = image_url?.trim() || null;
  if (is_milestone !== undefined) updates.is_milestone = is_milestone;
  if (milestone_label !== undefined) updates.milestone_label = milestone_label?.trim() || null;

  const { data, error } = await supabaseAdmin
    .from('campaign_updates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'failed to update', details: error?.message },
      { status: 500 },
    );
  }

  revalidatePath('/campaign');
  return NextResponse.json({ update: data });
}
