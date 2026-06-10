import 'server-only';

import { supabaseAdmin } from '@/lib/supabase-admin';

/* =========================================================
   WHOLESALE DISCOUNT CODES
   =========================================================
   On approval, every wholesale account gets 4 one-time-use
   25%-off codes: one for its own first order, three to hand
   out to referrals. Helpers here generate them idempotently,
   look one up at checkout, and mark it redeemed on payment.
   ========================================================= */

export const WHOLESALE_DISCOUNT_PERCENT = 25;

export type WholesaleCodeKind = 'first_order' | 'referral';

export interface WholesaleDiscountCode {
  id: string;
  wholesale_account_id: string;
  code: string;
  percent_off: number;
  kind: WholesaleCodeKind;
  redeemed_at: string | null;
  redeemed_order_id: string | null;
  created_at: string;
}

// The set of codes minted per approved account: 1 for their first order,
// 3 for referrals = 4 total.
const CODE_PLAN: WholesaleCodeKind[] = [
  'first_order',
  'referral',
  'referral',
  'referral',
];

// Unambiguous alphabet — no 0/O/1/I so codes are easy to read aloud / type.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function businessPrefix(businessName: string | null | undefined): string {
  const cleaned = (businessName ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  return cleaned.length >= 3 ? cleaned : 'KIWI';
}

async function codeExists(code: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('wholesale_discount_codes')
    .select('id')
    .ilike('code', code)
    .maybeSingle();
  return Boolean(data);
}

async function makeUniqueCode(prefix: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = `${prefix}-${randomSuffix()}`;
    // eslint-disable-next-line no-await-in-loop
    if (!(await codeExists(candidate))) return candidate;
  }
  // Extremely unlikely; widen the suffix to all-but-guarantee uniqueness.
  return `${prefix}-${randomSuffix(8)}`;
}

interface AccountRow {
  id: string;
  business_name: string | null;
  user_id: string | null;
  intake_notes: string | null;
}

/**
 * Ensure an approved account has its 4 welcome codes. Idempotent: if codes
 * already exist for the account, returns them untouched. Returns the full
 * set of codes for the account (existing + any just-created).
 */
export async function ensureWholesaleCodes(
  accountId: string
): Promise<WholesaleDiscountCode[]> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('wholesale_discount_codes')
    .select('*')
    .eq('wholesale_account_id', accountId)
    .order('created_at', { ascending: true });

  if (existingError) {
    throw new Error(`Failed to load wholesale codes: ${existingError.message}`);
  }
  if (existing && existing.length > 0) {
    return existing as WholesaleDiscountCode[];
  }

  const { data: account, error: accountError } = await supabaseAdmin
    .from('wholesale_accounts')
    .select('id, business_name, user_id, intake_notes')
    .eq('id', accountId)
    .maybeSingle<AccountRow>();

  if (accountError || !account) {
    throw new Error(
      `Wholesale account not found for code generation: ${accountId}`
    );
  }

  const prefix = businessPrefix(account.business_name);
  const rows: Array<{
    wholesale_account_id: string;
    code: string;
    percent_off: number;
    kind: WholesaleCodeKind;
  }> = [];

  for (const kind of CODE_PLAN) {
    // eslint-disable-next-line no-await-in-loop
    const code = await makeUniqueCode(prefix);
    rows.push({
      wholesale_account_id: accountId,
      code,
      percent_off: WHOLESALE_DISCOUNT_PERCENT,
      kind,
    });
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('wholesale_discount_codes')
    .insert(rows)
    .select();

  if (insertError) {
    throw new Error(`Failed to create wholesale codes: ${insertError.message}`);
  }

  return (inserted ?? []) as WholesaleDiscountCode[];
}

/**
 * Resolve the best email to send the welcome codes to: the linked profile's
 * email, falling back to the contact_email captured in intake_notes.
 */
export async function resolveAccountEmail(
  accountId: string
): Promise<string | null> {
  const { data: account } = await supabaseAdmin
    .from('wholesale_accounts')
    .select('user_id, intake_notes')
    .eq('id', accountId)
    .maybeSingle<{ user_id: string | null; intake_notes: string | null }>();

  if (!account) return null;

  if (account.user_id) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', account.user_id)
      .maybeSingle<{ email: string | null }>();
    if (profile?.email) return profile.email;
  }

  const match = account.intake_notes?.match(/contact_email=([^\s\n]+)/i);
  return match?.[1] ?? null;
}

/**
 * Look up a code that is valid to apply at checkout: it exists and has not
 * been redeemed yet. Returns null otherwise.
 */
export async function findRedeemableCode(
  code: string
): Promise<WholesaleDiscountCode | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const { data } = await supabaseAdmin
    .from('wholesale_discount_codes')
    .select('*')
    .ilike('code', trimmed)
    .is('redeemed_at', null)
    .maybeSingle<WholesaleDiscountCode>();

  return data ?? null;
}

/**
 * Mark the code attached to a paid order as redeemed. Guarded on
 * redeemed_at IS NULL so concurrent webhooks can't double-redeem.
 */
export async function redeemCodeForOrder(
  code: string,
  orderId: string
): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) return;

  const { error } = await supabaseAdmin
    .from('wholesale_discount_codes')
    .update({
      redeemed_at: new Date().toISOString(),
      redeemed_order_id: orderId,
    })
    .ilike('code', trimmed)
    .is('redeemed_at', null);

  if (error) {
    console.error('[wholesale-codes] failed to redeem code', {
      code: trimmed,
      orderId,
      error,
    });
  }
}
