import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS_VALUES = ['todo', 'in_progress', 'done', 'blocked'] as const;
const ITEM_KIND_VALUES = ['budget', 'milestone'] as const;

const patchSchema = z.object({
  plan_id: z.string().trim().min(1).max(64),
  item_kind: z.enum(ITEM_KIND_VALUES),
  item_key: z.string().trim().min(1).max(200),
  status: z.enum(STATUS_VALUES).optional(),
  checked: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

interface ProgressRow {
  plan_id: string;
  item_kind: 'budget' | 'milestone';
  item_key: string;
  status: (typeof STATUS_VALUES)[number];
  checked: boolean;
  notes: string | null;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const planId = request.nextUrl.searchParams.get('plan_id');

  let query = supabaseAdmin
    .from('pitch_progress')
    .select('plan_id, item_kind, item_key, status, checked, notes, updated_at');

  if (planId) query = query.eq('plan_id', planId);

  const { data, error } = await query.returns<ProgressRow[]>();

  if (error) {
    return NextResponse.json(
      { error: 'failed to load pitch progress', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ rows: data ?? [] });
}

export async function PATCH(request: NextRequest) {
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
        { error: err.issues[0]?.message ?? 'validation failed' },
        { status: 400 },
      );
    }
    throw err;
  }

  const upsertRow = {
    plan_id: parsed.plan_id,
    item_kind: parsed.item_kind,
    item_key: parsed.item_key,
    ...(parsed.status !== undefined ? { status: parsed.status } : {}),
    ...(parsed.checked !== undefined ? { checked: parsed.checked } : {}),
    ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
    updated_by: auth.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('pitch_progress')
    .upsert(upsertRow, { onConflict: 'plan_id,item_kind,item_key' })
    .select('plan_id, item_kind, item_key, status, checked, notes, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'failed to save', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ row: data });
}
