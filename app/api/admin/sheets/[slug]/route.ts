import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function DELETE(_request: NextRequest, props: RouteContext): Promise<NextResponse> {
  const params = await props.params;
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { error } = await supabaseAdmin
    .from('admin_sheets')
    .delete()
    .eq('slug', params.slug);

  if (error) {
    return NextResponse.json(
      { error: 'failed to delete sheet', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
