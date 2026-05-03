import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeRaffleSource, RAFFLE_SOURCE_PREFIX } from '@/lib/raffle';

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

// Postgres "undefined_table" — surfaced when migration 010 hasn't run yet.
const PG_UNDEFINED_TABLE = '42P01';

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
  const slug = parsed.raffle_slug ?? 'artwork-001';
  const email = parsed.email.toLowerCase();

  const primary = await supabaseAdmin.from('raffle_entries').upsert(
    {
      raffle_slug: slug,
      name: parsed.name,
      email,
      phone: parsed.phone ?? null,
      social_handle: parsed.social_handle ?? null,
      source: parsed.source ?? 'landing',
      ip_address: ip,
      user_agent: userAgent,
    },
    { onConflict: 'raffle_slug,email', ignoreDuplicates: false },
  );

  if (!primary.error) {
    return NextResponse.json({ ok: true, storage: 'raffle_entries' });
  }

  // Fallback: if migration 010 hasn't been applied yet, the canonical table
  // is missing. Park the entry in email_signups with the raffle payload
  // encoded into `source` so we don't lose anything; admin /admin/raffle
  // reads + decodes both surfaces. Once 009 lands, switch back to the
  // primary table automatically.
  const isMissingTable =
    primary.error.code === PG_UNDEFINED_TABLE ||
    /relation .*raffle_entries.* does not exist/i.test(primary.error.message);

  if (!isMissingTable) {
    return NextResponse.json(
      { error: "couldn't save your entry", details: primary.error.message },
      { status: 500 },
    );
  }

  const fallbackSource = encodeRaffleSource({
    slug,
    name: parsed.name,
    phone: parsed.phone,
    social_handle: parsed.social_handle,
    origin: parsed.source ?? 'landing',
  });

  const fallback = await supabaseAdmin.from('email_signups').upsert(
    {
      email,
      source: fallbackSource,
      ip_address: ip,
      user_agent: userAgent,
    },
    { onConflict: 'email', ignoreDuplicates: false },
  );

  if (fallback.error) {
    return NextResponse.json(
      { error: "couldn't save your entry", details: fallback.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    storage: 'email_signups_fallback',
    source_prefix: RAFFLE_SOURCE_PREFIX,
  });
}
