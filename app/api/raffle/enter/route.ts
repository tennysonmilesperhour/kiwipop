import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const entrySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  email: z.string().trim().email('valid email please').max(255),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  social_handle: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  raffle_slug: z.string().trim().max(64).optional(),
  source: z.string().trim().max(50).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = entrySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0]?.message ?? 'invalid entry';
      return NextResponse.json({ error: first.toLowerCase() }, { status: 400 });
    }
    throw err;
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  const { error } = await supabaseAdmin.from('raffle_entries').upsert(
    {
      raffle_slug: parsed.raffle_slug ?? 'artwork-001',
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      phone: parsed.phone ?? null,
      social_handle: parsed.social_handle ?? null,
      source: parsed.source ?? 'landing',
      ip_address: ip,
      user_agent: userAgent,
    },
    { onConflict: 'raffle_slug,email', ignoreDuplicates: false },
  );

  if (error) {
    return NextResponse.json(
      { error: "couldn't save your entry", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
