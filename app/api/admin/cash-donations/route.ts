import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cashDonationCreateSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('cash_donations')
    .select('id, amount_cents, donor_name, note, received_at, created_at')
    .order('received_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'failed to load donations', details: error.message },
      { status: 500 },
    );
  }

  const totalCents = (data ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );

  return NextResponse.json({ donations: data ?? [], totalCents });
}

export async function POST(request: NextRequest) {
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
    parsed = cashDonationCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: err.issues[0]?.message?.toLowerCase() ?? 'validation failed',
          issues: err.flatten(),
        },
        { status: 400 },
      );
    }
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('cash_donations')
    .insert({
      amount_cents: parsed.amount_cents,
      donor_name: parsed.donor_name?.trim() || null,
      note: parsed.note?.trim() || null,
      received_at: parsed.received_at ?? new Date().toISOString().slice(0, 10),
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'failed to record donation', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ donation: data }, { status: 201 });
}
