import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { quoteCreateSchema, type QuoteItem } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('quotes')
    .select(
      'id, wholesale_account_id, status, items, total_cents, expires_at, created_at, wholesale_accounts(business_name)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ quotes: data ?? [] });
}

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
    parsed = quoteCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const totalCents = parsed.items.reduce(
    (sum: number, item: QuoteItem) => sum + item.quantity * item.price_cents,
    0
  );

  const { data, error } = await supabaseAdmin
    .from('quotes')
    .insert({
      wholesale_account_id: parsed.wholesale_account_id,
      items: parsed.items,
      total_cents: totalCents,
      expires_at: parsed.expires_at ?? null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create quote', details: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ quote: data });
}
