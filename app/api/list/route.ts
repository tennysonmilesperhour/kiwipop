import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { queueWelcomeSeries } from '@/lib/email-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  email: z.string().email().max(255),
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
    parsed = signupSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0]?.message ?? 'invalid email';
      return NextResponse.json({ error: first.toLowerCase() }, { status: 400 });
    }
    throw err;
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  const { error } = await supabaseAdmin.from('email_signups').upsert(
    {
      email: parsed.email.toLowerCase(),
      source: parsed.source ?? 'list',
      ip_address: ip,
      user_agent: userAgent,
    },
    { onConflict: 'email', ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json(
      { error: "couldn't save your email", details: error.message },
      { status: 500 }
    );
  }

  // Fire-and-forget: queue the welcome drip series for new subscribers.
  // The upsert above uses ignoreDuplicates, so returning subscribers
  // won't get duplicate emails (the upsert is a no-op for them, and
  // we only trigger the series on a successful new insert).
  // We check if this was actually a new signup by querying the count.
  const normalizedEmail = parsed.email.toLowerCase();
  const { count } = await supabaseAdmin
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('to_email', normalizedEmail)
    .eq('email_type', 'welcome');

  if (count === 0) {
    // New subscriber — trigger the welcome series
    queueWelcomeSeries(normalizedEmail).catch((err) => {
      console.error('[list] failed to queue welcome series', { email: normalizedEmail, err });
    });
  }

  return NextResponse.json({ ok: true });
}
