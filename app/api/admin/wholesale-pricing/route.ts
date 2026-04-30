import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { wholesalePricingCreateSchema } from '@/lib/validators';

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
    parsed = wholesalePricingCreateSchema.parse(body);
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
    .from('wholesale_pricing')
    .insert({
      product_id: parsed.product_id,
      tier: parsed.tier,
      price_cents: parsed.price_cents,
      min_quantity: parsed.min_quantity,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create pricing tier', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ pricing: data }, { status: 201 });
}
