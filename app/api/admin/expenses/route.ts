import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { expenseCreateSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = expenseCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({
      category: parsed.category,
      amount_cents: parsed.amount_cents,
      description: parsed.description ?? null,
      receipt_url: parsed.receipt_url || null,
      expense_date: parsed.expense_date,
      batch_id: parsed.batch_id || null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create expense', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
