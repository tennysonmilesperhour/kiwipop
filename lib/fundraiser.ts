import 'server-only';
import { supabaseAdmin } from './supabase-admin';

/**
 * Public launch fundraiser tracker. Total raised = baseline pledge from the
 * founder + every dollar the storefront has actually collected (paid orders +
 * donations product, since donations route through Stripe Checkout the same
 * as a sale). Read on the homepage server component to render the progress
 * bar above the nav.
 */

export const FUNDRAISER_GOAL_CENTS = 500_000;
export const FUNDRAISER_BASELINE_CENTS = 5_000;

const COUNTED_STATUSES = ['paid', 'shipped', 'completed'] as const;

export interface FundraiserSnapshot {
  raisedCents: number;
  goalCents: number;
  baselineCents: number;
  paidOrderCents: number;
  percent: number;
  remainingCents: number;
}

/**
 * Sums total_cents from orders whose payment has actually settled, then
 * adds the baseline. Network failures fall back to the baseline so a
 * Supabase blip never takes down the homepage.
 */
export async function loadFundraiserSnapshot(): Promise<FundraiserSnapshot> {
  let paidOrderCents = 0;

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('total_cents')
      .in('status', COUNTED_STATUSES);

    if (!error && data) {
      paidOrderCents = data.reduce(
        (sum: number, row: { total_cents: number | null }) =>
          sum + (row.total_cents ?? 0),
        0,
      );
    }
  } catch {
    // swallow — render with baseline only
  }

  const raisedCents = Math.min(
    FUNDRAISER_GOAL_CENTS,
    FUNDRAISER_BASELINE_CENTS + paidOrderCents,
  );
  const percent = Math.min(100, (raisedCents / FUNDRAISER_GOAL_CENTS) * 100);
  const remainingCents = Math.max(0, FUNDRAISER_GOAL_CENTS - raisedCents);

  return {
    raisedCents,
    goalCents: FUNDRAISER_GOAL_CENTS,
    baselineCents: FUNDRAISER_BASELINE_CENTS,
    paidOrderCents,
    percent,
    remainingCents,
  };
}
