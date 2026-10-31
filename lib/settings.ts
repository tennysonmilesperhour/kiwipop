import 'server-only';
import { supabaseAdmin } from './supabase-admin';

/**
 * Reads the site-wide "preorder only" flag from the app_settings singleton.
 *
 * When true, the whole storefront switches from normal sales to preorders as
 * the only option. See migration 047. Any read failure (missing column on a
 * not-yet-migrated database, network blip) degrades to `false` so the store
 * defaults to normal sales rather than accidentally hiding "buy now".
 */
export async function getPreorderOnlyMode(): Promise<boolean> {
  return readBooleanSetting('preorder_only_mode');
}

/**
 * Switch for checkout abandonment recovery emails. OFF by default; see
 * docs/abandoned-checkout-email.md. Abandoned checkouts are recorded either
 * way; this only controls whether the recovery email is sent.
 */
export async function getAbandonedCheckoutEmailsEnabled(): Promise<boolean> {
  return readBooleanSetting('abandoned_checkout_emails_enabled');
}

/**
 * Switch for wholesale referral codes. OFF by default: approved accounts get
 * only their first-order code, and referral codes are not accepted at
 * checkout. See docs/open-items.md (item 19) for how to turn it on.
 */
export async function getWholesaleReferralCodesEnabled(): Promise<boolean> {
  return readBooleanSetting('wholesale_referral_codes_enabled');
}

type BooleanSetting =
  | 'preorder_only_mode'
  | 'abandoned_checkout_emails_enabled'
  | 'wholesale_referral_codes_enabled';

/**
 * Every switch reads false on any failure, so a missing column or a network
 * blip never turns on behaviour (or emails) by accident.
 */
async function readBooleanSetting(column: BooleanSetting): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select(column)
      .eq('id', 1)
      .maybeSingle<Record<BooleanSetting, boolean | null>>();

    if (error) return false;
    return data?.[column] === true;
  } catch {
    return false;
  }
}
