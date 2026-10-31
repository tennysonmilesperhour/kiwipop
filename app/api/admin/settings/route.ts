import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { appSettingsUpdateSchema } from '@/lib/validators';
import { effectiveTargetVolume, planTargetVolumeFor } from '@/lib/plan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SETTINGS_COLUMNS =
  'monthly_overhead_cents, target_monthly_volume, target_volume_follows_plan, active_cost_basis, preorder_only_mode, abandoned_checkout_emails_enabled, wholesale_referral_codes_enabled, updated_at';

interface SettingsRow {
  monthly_overhead_cents: number;
  target_monthly_volume: number;
  target_volume_follows_plan: boolean | null;
  active_cost_basis: string;
  preorder_only_mode: boolean;
  abandoned_checkout_emails_enabled: boolean;
  wholesale_referral_codes_enabled: boolean;
  updated_at: string;
}

/**
 * `target_monthly_volume` in the response is the number pages should divide
 * overhead by: this month's plan figure while following the plan, otherwise
 * the stored override. The raw column comes back as
 * `target_monthly_volume_stored`.
 */
function present(row: SettingsRow) {
  const effective = effectiveTargetVolume(row);
  return {
    ...row,
    target_monthly_volume: effective.volume,
    target_monthly_volume_stored: row.target_monthly_volume,
    target_volume_source: effective.source,
    target_volume_plan_label: effective.planLabel,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select(SETTINGS_COLUMNS)
    .eq('id', 1)
    .single<SettingsRow>();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Settings not found' },
      { status: 500 }
    );
  }
  return NextResponse.json(present(data));
}

export async function PATCH(request: NextRequest) {
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
    parsed = appSettingsUpdateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  if (Object.keys(parsed).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const update: Record<string, unknown> = { ...parsed };
  // Typing a volume by hand is a manual override of the plan figure.
  if (
    parsed.target_monthly_volume !== undefined &&
    parsed.target_volume_follows_plan === undefined
  ) {
    update.target_volume_follows_plan = false;
  }
  // Going back to the plan writes this month's figure straight away.
  if (parsed.target_volume_follows_plan === true) {
    const planned = planTargetVolumeFor(new Date());
    if (planned !== null) update.target_monthly_volume = planned;
  }

  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select(SETTINGS_COLUMNS)
    .single<SettingsRow>();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Settings not found' },
      { status: 500 }
    );
  }
  return NextResponse.json(present(data));
}
