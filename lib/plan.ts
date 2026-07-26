/* =========================================================
   THE 2026 PLAN — canonical numbers
   =========================================================
   Everything the admin needs to answer "are we on track?"
   in one place, so a page never invents its own target.

   Source of truth is docs/revenue-plan-2026.md; this file
   is the machine-readable copy. If they disagree, the doc
   wins and this file is stale — fix it here.

   Companion modules:
     lib/wholesale-tiers.ts    the price ladder
     lib/production-cost.ts    labour + kitchen conversion
   ========================================================= */

/** Monthly salary pool the business is being built to support, in cents. */
export const SALARY_TARGET_CENTS = 800_000;

/** Headcount that pool is split across. */
export const SALARY_HEADCOUNT = 3;

/** Fixed operating cost per month at scale, in cents (migration 044). */
export const MONTHLY_OPEX_CENTS = 152_000;

/** Marketing + sampling budget per month at scale, in cents. */
export const MONTHLY_MARKETING_CENTS = 88_000;

export interface PlanMonth {
  /** First of the month, ISO date. */
  month: string;
  label: string;
  /** New wholesale doors signed this month. */
  newDoors: number;
  /** Cumulative doors at month end. */
  cumulativeDoors: number;
  /** Finished pops across every channel. */
  pops: number;
  revenueCents: number;
  /** Gross profit on the in-house production basis. */
  grossProfitCents: number;
  /** Sales commission under Option A of the commission plan. */
  commissionCents: number;
  /** What's left for salary after opex, marketing, and commission. */
  availableForSalaryCents: number;
  /** What the plan actually draws — deliberately below "available". */
  salaryDrawCents: number;
}

/**
 * Aug–Dec 2026 ramp, on the in-house production basis (tier-3 materials plus
 * $0.45/pop staffed conversion). Figures from docs/revenue-plan-2026.md §4 and
 * docs/sales-commission-plan.md.
 */
export const PLAN_MONTHS: readonly PlanMonth[] = [
  {
    month: '2026-08-01',
    label: 'Aug',
    newDoors: 6,
    cumulativeDoors: 6,
    pops: 1_400,
    revenueCents: 430_000,
    grossProfitCents: 187_000,
    commissionCents: 27_000,
    availableForSalaryCents: -40_000,
    salaryDrawCents: 0,
  },
  {
    month: '2026-09-01',
    label: 'Sep',
    newDoors: 10,
    cumulativeDoors: 16,
    pops: 2_760,
    revenueCents: 843_000,
    grossProfitCents: 385_000,
    commissionCents: 50_400,
    availableForSalaryCents: 115_000,
    salaryDrawCents: 0,
  },
  {
    month: '2026-10-01',
    label: 'Oct',
    newDoors: 12,
    cumulativeDoors: 28,
    pops: 4_710,
    revenueCents: 1_320_800,
    grossProfitCents: 644_000,
    commissionCents: 102_600,
    availableForSalaryCents: 301_000,
    salaryDrawCents: 300_000,
  },
  {
    month: '2026-11-01',
    label: 'Nov',
    newDoors: 14,
    cumulativeDoors: 42,
    pops: 6_480,
    revenueCents: 1_786_500,
    grossProfitCents: 869_000,
    commissionCents: 144_300,
    availableForSalaryCents: 485_000,
    salaryDrawCents: 480_000,
  },
  {
    month: '2026-12-01',
    label: 'Dec',
    newDoors: 14,
    cumulativeDoors: 56,
    pops: 8_120,
    revenueCents: 2_198_500,
    grossProfitCents: 1_065_200,
    commissionCents: 169_100,
    availableForSalaryCents: 656_000,
    salaryDrawCents: 650_000,
  },
] as const;

/** Opening order a new door places, in pops. */
export const DOOR_OPENING_POPS = 150;

/** Steady-state monthly reorder per door, in pops. */
export const DOOR_REORDER_POPS = 60;

/**
 * Doors needed to hit the December number at a given average monthly reorder.
 * The plan assumes 60; this is the sensitivity that matters most, because
 * door productivity is the least-tested assumption in the whole model.
 */
export const DOOR_SENSITIVITY: ReadonlyArray<{
  reorderPops: number;
  doorsNeeded: number;
}> = [
  { reorderPops: 80, doorsNeeded: 44 },
  { reorderPops: 60, doorsNeeded: 56 },
  { reorderPops: 40, doorsNeeded: 78 },
  { reorderPops: 25, doorsNeeded: 112 },
];

/** The plan month covering `date`, or null outside the Aug–Dec window. */
export function planMonthFor(date: Date): PlanMonth | null {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  return PLAN_MONTHS.find((m) => m.month === key) ?? null;
}

/** The plan month for right now. */
export function currentPlanMonth(): PlanMonth | null {
  return planMonthFor(new Date());
}

/** Plan totals across the whole Aug–Dec window. */
export const PLAN_TOTALS = {
  pops: PLAN_MONTHS.reduce((s, m) => s + m.pops, 0),
  revenueCents: PLAN_MONTHS.reduce((s, m) => s + m.revenueCents, 0),
  salaryCents: PLAN_MONTHS.reduce((s, m) => s + m.salaryDrawCents, 0),
};

/**
 * Levers that close the December shortfall, from docs/open-items.md §1.
 * Monthly value at December volume. These are the answer to "we're behind" —
 * none of them require selling more.
 */
export const CLOSING_LEVERS: ReadonlyArray<{
  label: string;
  monthlyValueCents: number;
  effort: string;
}> = [
  {
    label: 'Tier-3 materials (isomalt rung 3, magnesium 25 kg, lemon 25 kg)',
    monthlyValueCents: 179_000,
    effort: '3 purchase orders',
  },
  {
    label: 'Throughput 75 → 110 pops/hr (moulds, 2nd burner, heat sealer)',
    monthlyValueCents: 86_500,
    effort: '~$1,200 once',
  },
  {
    label: 'Luster dust 1 kg case tier',
    monthlyValueCents: 25_000,
    effort: 'one email',
  },
  {
    label: 'Labels on a 1,000+ roll',
    monthlyValueCents: 19_500,
    effort: 'one order',
  },
  {
    label: 'Foil: single-colour packs (a third of the 6-colour pack is waste)',
    monthlyValueCents: 15_000,
    effort: 'change what you order',
  },
];

/** December shortfall the levers above have to cover, in cents. */
export const DECEMBER_SHORTFALL_CENTS =
  SALARY_TARGET_CENTS -
  (PLAN_MONTHS[PLAN_MONTHS.length - 1]?.availableForSalaryCents ?? 0);
