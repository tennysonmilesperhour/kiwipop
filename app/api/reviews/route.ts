import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { ZodError, z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  display_name: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(4).max(1200),
  source: z.string().trim().max(50).optional(),
  // Honeypot — real users won't fill this; bots will.
  website: z.string().max(0).optional(),
});

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = submitSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0]?.message ?? 'invalid input';
      return NextResponse.json({ error: first.toLowerCase() }, { status: 400 });
    }
    throw err;
  }

  if (parsed.website && parsed.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  const { error } = await supabaseAdmin.from('reviews').insert({
    display_name: parsed.display_name,
    email: parsed.email ? parsed.email.toLowerCase() : null,
    rating: parsed.rating,
    body: parsed.body,
    source: parsed.source ?? 'landing',
    user_agent: userAgent,
    ip_hash: hashIp(ip),
    status: 'pending',
  });

  if (error) {
    return NextResponse.json(
      { error: "couldn't save your review", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('id, display_name, rating, body, approved_at')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json(
      { error: "couldn't load reviews", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ reviews: data ?? [] });
}
