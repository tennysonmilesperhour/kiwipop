import 'server-only';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { findRedeemableCode, redeemCodeForOrder } from '@/lib/wholesale-codes';

/* =========================================================
   UNIFIED CHECKOUT DISCOUNTS
   =========================================================
   Two kinds of one-time codes can be applied at checkout:
     • wholesale welcome codes — percent off (lib/wholesale-codes)
     • rewards codes — fixed amount off, minted by spending points
   This module resolves either kind for the checkout/validate
   routes and marks the right one redeemed when an order pays.
   ========================================================= */

export interface ResolvedDiscount {
  code: string;
  /** Percent off the product subtotal (wholesale codes). 0 when amount-based. */
  percentOff: number;
  /** Fixed cents off the product subtotal (reward codes). 0 when percent-based. */
  amountOffCents: number;
}

interface RewardCodeRow {
  code: string;
  amount_off_cents: number;
}

/**
 * Resolve a code that is currently valid to apply at checkout. Checks
 * wholesale codes first (percent off), then reward codes (amount off).
 * Returns null if the code is unknown or already used.
 */
export async function resolveDiscount(
  rawCode: string
): Promise<ResolvedDiscount | null> {
  const code = rawCode.trim();
  if (!code) return null;

  const wholesale = await findRedeemableCode(code);
  if (wholesale) {
    return { code: wholesale.code, percentOff: wholesale.percent_off, amountOffCents: 0 };
  }

  const { data } = await supabaseAdmin
    .from('reward_codes')
    .select('code, amount_off_cents')
    .ilike('code', code)
    .is('redeemed_at', null)
    .maybeSingle<RewardCodeRow>();

  if (data) {
    return { code: data.code, percentOff: 0, amountOffCents: data.amount_off_cents };
  }

  return null;
}

/**
 * Mark whichever code (wholesale or reward) is attached to a now-paid order as
 * redeemed. Both updates are guarded on redeemed_at IS NULL so concurrent
 * webhooks can't double-redeem. No-op for codes that don't match either table.
 */
export async function redeemDiscountForOrder(
  code: string,
  orderId: string
): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) return;

  // Wholesale codes (idempotent, guarded internally).
  await redeemCodeForOrder(trimmed, orderId);

  // Reward codes.
  const { error } = await supabaseAdmin
    .from('reward_codes')
    .update({ redeemed_at: new Date().toISOString(), redeemed_order_id: orderId })
    .ilike('code', trimmed)
    .is('redeemed_at', null);

  if (error) {
    console.error('[discounts] failed to redeem reward code', { code: trimmed, orderId, error });
  }
}

// Unambiguous alphabet — no 0/O/1/I so codes read cleanly.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Generate a unique reward code (e.g. "KIWI5-AB3KX9"). */
export async function makeRewardCode(prefix = 'KIWI5'): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = `${prefix}-${randomSuffix()}`;
    // eslint-disable-next-line no-await-in-loop
    const { data } = await supabaseAdmin
      .from('reward_codes')
      .select('id')
      .ilike('code', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${prefix}-${randomSuffix(9)}`;
}
