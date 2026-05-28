import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { quoteUpdateSchema, type QuoteItem } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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
    parsed = quoteUpdateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.status !== undefined) updates.status = parsed.status;
  if (parsed.expires_at !== undefined) updates.expires_at = parsed.expires_at;
  if (parsed.items !== undefined) {
    updates.items = parsed.items;
    updates.total_cents = parsed.items.reduce(
      (sum: number, item: QuoteItem) => sum + item.quantity * item.price_cents,
      0
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('quotes')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to update quote', details: error?.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ quote: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { error } = await supabaseAdmin
    .from('quotes')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete quote', details: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
