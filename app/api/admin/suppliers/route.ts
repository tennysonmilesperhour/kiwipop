import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supplierCreateSchema } from '@/lib/validators';

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
    parsed = supplierCreateSchema.parse(body);
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
    .from('suppliers')
    .insert({
      name: parsed.name,
      contact_email: parsed.contact_email || null,
      supplier_type: parsed.supplier_type,
      lead_time_days: parsed.lead_time_days ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ supplier: data }, { status: 201 });
}
