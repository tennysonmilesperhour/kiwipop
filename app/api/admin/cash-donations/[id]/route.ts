import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, props: RouteContext) {
  const params = await props.params;
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { error } = await supabaseAdmin
    .from('cash_donations')
    .delete()
    .eq('id', params.id);

  if (error) {
    if (
      error.code === '42P01' ||
      /relation .*cash_donations.* does not exist/i.test(error.message ?? '')
    ) {
      return NextResponse.json(
        {
          error:
            'cash_donations table not found — apply supabase/migrations/20260503021032_012_cash_donations.sql (`supabase db push`) and refresh.',
          migration_pending: true,
          migration: '20260503021032_012_cash_donations.sql',
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'failed to delete donation', details: error.message },
      { status: 500 },
    );
  }

  // Homepage uses ISR (revalidate = 60) — bust the cache so the progress
  // bar reflects the removed donation on the next request.
  revalidatePath('/');
  revalidatePath('/donate');

  return NextResponse.json({ ok: true });
}
