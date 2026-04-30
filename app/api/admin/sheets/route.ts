import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sheetUpsertSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('admin_sheets')
    .select('slug, label, embed_url, height_px, position, updated_at')
    .order('position', { ascending: true })
    .order('label', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'failed to load sheets', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ sheets: data ?? [] });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = sheetUpsertSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0]?.message ?? 'validation failed';
      return NextResponse.json(
        { error: first.toLowerCase(), issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const row = {
    slug: parsed.slug,
    label: parsed.label,
    embed_url: parsed.embed_url,
    height_px: parsed.height_px ?? 700,
    position: parsed.position ?? 0,
  };

  const { data, error } = await supabaseAdmin
    .from('admin_sheets')
    .upsert(row, { onConflict: 'slug' })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'failed to save sheet', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ sheet: data }, { status: 200 });
}
