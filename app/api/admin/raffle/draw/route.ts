import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const drawSchema = z.object({
  slug: z.string().trim().max(64).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let parsed: { slug?: string } = {};
  if (request.headers.get('content-length') !== '0') {
    try {
      const body = await request.json();
      parsed = drawSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: err.issues[0]?.message ?? 'invalid request' },
          { status: 400 },
        );
      }
      // body absent / malformed — fall through with default slug
    }
  }

  const slug = parsed.slug ?? 'artwork-001';

  // The function is SECURITY DEFINER and runs the random pick + winner-mark
  // as a single statement, so two concurrent admin clicks can't both win.
  const { data, error } = await supabaseAdmin.rpc('draw_raffle_winner', {
    p_slug: slug,
  });

  if (error) {
    return NextResponse.json(
      { error: 'failed to draw winner', details: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'no eligible entries left to draw' },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, winner: data });
}
