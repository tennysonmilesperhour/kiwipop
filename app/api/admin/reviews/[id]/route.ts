import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ZodError, z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = patchSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message?.toLowerCase() ?? 'validation failed' },
        { status: 400 }
      );
    }
    throw err;
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: parsed.status,
    decided_by: auth.userId,
    approved_at: parsed.status === 'approved' ? now : null,
    rejected_at: parsed.status === 'rejected' ? now : null,
  };

  const { error } = await supabaseAdmin
    .from('reviews')
    .update(update)
    .eq('id', params.id);

  if (error) {
    return NextResponse.json(
      { error: 'failed to update review', details: error.message },
      { status: 500 }
    );
  }

  revalidatePath('/');

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { error } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json(
      { error: 'failed to delete review', details: error.message },
      { status: 500 }
    );
  }

  revalidatePath('/');

  return NextResponse.json({ ok: true });
}
