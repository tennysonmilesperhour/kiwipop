/**
 * Kiwi Pop rewards economics. One place so the storefront copy, the account
 * page, and the redeem endpoint never drift apart.
 *
 *   • Earn 5 points for every whole dollar paid.
 *   • 500 points redeem for a one-time $5-off reward code (~5% back).
 */
export const POINTS_PER_DOLLAR = 5;
export const POINTS_PER_REWARD = 500;
export const REWARD_VALUE_CENTS = 500;

/** Points earned for a paid order total in cents (whole dollars only). */
export function pointsForOrderCents(totalCents: number): number {
  return Math.floor(totalCents / 100) * POINTS_PER_DOLLAR;
}
