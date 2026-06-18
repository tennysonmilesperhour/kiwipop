import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { makeRewardCode } from '@/lib/discounts';
import { POINTS_PER_REWARD, REWARD_VALUE_CENTS } from '@/lib/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Redeem POINTS_PER_REWARD points for a one-time $5-off reward code. The RPC
 * guards the balance, mints the code, and debits points atomically.
 */
export async function POST() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('points_balance')
    .eq('id', user.id)
    .maybeSingle<{ points_balance: number }>();

  if (!profile || profile.points_balance < POINTS_PER_REWARD) {
    return NextResponse.json(
      { error: `You need at least ${POINTS_PER_REWARD} points to redeem.` },
      { status: 400 }
    );
  }

  const code = await makeRewardCode();

  const { error: rpcError } = await supabaseAdmin.rpc('redeem_points_for_reward', {
    p_user: user.id,
    p_points: POINTS_PER_REWARD,
    p_amount_cents: REWARD_VALUE_CENTS,
    p_code: code,
  });

  if (rpcError) {
    return NextResponse.json(
      { error: 'Failed to redeem points', details: rpcError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    code,
    amountOffCents: REWARD_VALUE_CENTS,
    pointsSpent: POINTS_PER_REWARD,
  });
}
