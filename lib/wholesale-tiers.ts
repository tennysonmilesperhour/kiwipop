/* =========================================================
   WHOLESALE TIER LADDER
   =========================================================
   One place for tier identity: the stored key, the label a
   buyer sees, the target minimum, and the pitch. The DB keys
   stay 'standard' | 'premium' | 'distributor' (migration 042
   widened the CHECK constraints) so existing account rows
   didn't need rewriting — everything customer-facing reads
   its label from here.

   The ladder is designed backwards from the RETAILER's margin,
   not forwards from our cost. Specialty and impulse retail
   closes at 40–50% margin; the old $2.00/$1.65 tiers handed
   over 60–67%, which was margin given away for nothing.
   ========================================================= */

export type WholesaleTier = 'standard' | 'premium' | 'distributor';

/** Cheapest-access first. Index doubles as the tier's rank. */
export const WHOLESALE_TIERS: readonly WholesaleTier[] = [
  'standard',
  'premium',
  'distributor',
] as const;

export interface WholesaleTierMeta {
  /** Buyer-facing name. */
  label: string;
  /** Target price per pop, in cents. Live prices come from wholesale_pricing. */
  targetPriceCents: number;
  /** Target minimum order, in pops. */
  targetMinQuantity: number;
  /** Who the tier is for — one line, used on the line sheet. */
  who: string;
  /** Internal note for the admin UI. */
  hint: string;
}

export const TIER_META: Record<WholesaleTier, WholesaleTierMeta> = {
  standard: {
    label: 'Door',
    targetPriceCents: 250,
    targetMinQuantity: 100,
    who: 'Single shops, bars, festival vendors, gift shops',
    hint: 'The default retail door. 100 pops = two counter displays plus backstock. Leaves the shop a 50% margin.',
  },
  premium: {
    label: 'Volume',
    targetPriceCents: 225,
    targetMinQuantity: 500,
    who: 'Small chains and multi-location accounts',
    hint: 'For accounts placing across several locations. 55% margin at MSRP.',
  },
  distributor: {
    label: 'Distributor',
    targetPriceCents: 185,
    targetMinQuantity: 2500,
    who: 'Distributors reselling to their own retail network',
    hint: 'Priced so a distributor can resell at the Door price ($2.50) and keep ~26%. Never quote this to a single shop.',
  },
};

/** Rank within the ladder — higher rank means deeper discount. */
export function tierRank(tier: WholesaleTier): number {
  const index = WHOLESALE_TIERS.indexOf(tier);
  return index === -1 ? 0 : index;
}

/**
 * The margin a retailer keeps if they buy at `tierPriceCents` and sell at
 * `retailCents`. Returns a whole-number percentage, or null when either side
 * is missing or the retail price is not above the wholesale price.
 */
export function retailerMarginPercent(
  retailCents: number | undefined,
  tierPriceCents: number | undefined
): number | null {
  if (!retailCents || !tierPriceCents) return null;
  if (retailCents <= tierPriceCents) return null;
  return Math.round(((retailCents - tierPriceCents) / retailCents) * 100);
}

/**
 * Our own gross margin on a wholesale pop. Same shape as the above but
 * measured against landed cost rather than MSRP — used in the admin only.
 */
export function ourMarginPercent(
  tierPriceCents: number | undefined,
  costCents: number | undefined
): number | null {
  if (!tierPriceCents || costCents == null) return null;
  if (tierPriceCents <= 0) return null;
  return Math.round(((tierPriceCents - costCents) / tierPriceCents) * 100);
}

export function tierLabel(tier: string | null | undefined): string {
  if (!tier) return '—';
  return TIER_META[tier as WholesaleTier]?.label ?? tier;
}
