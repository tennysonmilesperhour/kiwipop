/* =========================================================
   IN-HOUSE PRODUCTION COST MODEL
   =========================================================
   What it actually costs to make a pop ourselves with paid
   staff in a rented commissary kitchen, as opposed to buying
   the finished pop from a co-packer.

   The distinction that drives everything here:

     LABOUR cost scales with PERSON-hours.
     KITCHEN cost scales with CLOCK-hours.

   Three people running a parallel line — one cooking and
   blending, one pouring moulds and setting sticks, one
   demoulding, wrapping, labelling and packing — burn three
   person-hours per clock-hour but rent only one. That is why
   a staffed line is far cheaper on kitchen rent than the same
   hours worked solo, and why the weekly clock-hour figure
   looks so much smaller than the payroll figure suggests.

   Every constant below is a PLANNING ESTIMATE. The one that
   matters most is THROUGHPUT_POPS_PER_LABOUR_HOUR — measure it
   on the first three real sessions and correct it here. Every
   other number in the model is downstream of it.
   ========================================================= */

/**
 * Finished pops produced per person-hour on a staffed parallel line,
 * including cook, pour, set, demould, wrap, label, pack, and clean-down.
 *
 * Derived bottom-up from a ~500-pop session: ~20 min setup, ~45 min cook
 * (largely unattended), ~60 min pouring ten 50-cavity mould loads, ~40 min
 * demoulding, ~100 min wrap/label at 12 s per pop, ~45 min pack and clean —
 * about 7 person-hours once coordination overhead is allowed for.
 *
 * This assumes SCALED batches. The old 55-pop kitchen batch runs closer to
 * 35 pops/hour, which is what made the original plan's estimate twice this.
 */
export const THROUGHPUT_POPS_PER_LABOUR_HOUR = 75;

/** People working the line at once. Sets the clock-hour divisor. */
export const LINE_HEADCOUNT = 3;

/** Mid-point of the $20–25/hr band, in cents. */
export const WAGE_CENTS_PER_HOUR = 2250;

/**
 * Employer burden on top of gross wage: FICA 7.65%, FUTA, Utah SUTA, and
 * workers' compensation at a food-manufacturing class rate. 13% is the
 * mid-estimate; confirm the workers' comp rate with a quote, since it is the
 * only component that varies much by classification.
 */
export const PAYROLL_BURDEN_RATE = 0.13;

/** Fully loaded cost of one person-hour, in cents. */
export const LOADED_WAGE_CENTS_PER_HOUR = Math.round(
  WAGE_CENTS_PER_HOUR * (1 + PAYROLL_BURDEN_RATE)
);

/** Commissary rate per clock-hour, in cents (Square Kitchen SLC: $25/hr). */
export const KITCHEN_CENTS_PER_HOUR = 2500;

/** Monthly commissary minimum regardless of hours used, in cents. */
export const KITCHEN_MONTHLY_MINIMUM_CENTS = 45000;

/** Weeks per month, for converting a weekly schedule to a monthly one. */
const WEEKS_PER_MONTH = 4.33;

export interface ProductionMonth {
  /** Finished pops required this month. */
  pops: number;
  /** Person-hours of paid production time. */
  labourHours: number;
  /** Clock-hours of kitchen time, with the line running `headcount` deep. */
  clockHours: number;
  /** Clock-hours per week, the number to schedule against. */
  clockHoursPerWeek: number;
  /** Person-hours per week per employee, to check against their availability. */
  hoursPerPersonPerWeek: number;
  labourCents: number;
  kitchenCents: number;
  /** Labour + kitchen. Excludes materials. */
  conversionCents: number;
  /** Conversion cost per pop — the number to compare against a co-packer. */
  conversionCentsPerPop: number;
}

/**
 * Cost to convert materials into finished pops for one month at `pops` volume.
 *
 * Conversion cost per pop FALLS as volume rises, because the commissary
 * minimum is spread over more units — it is roughly $0.67/pop at 1,400
 * pops/month and settles near $0.45/pop above about 4,000.
 */
export function productionMonth(
  pops: number,
  opts: { headcount?: number; wageCentsPerHour?: number } = {}
): ProductionMonth {
  const headcount = opts.headcount ?? LINE_HEADCOUNT;
  const loadedWage = opts.wageCentsPerHour
    ? Math.round(opts.wageCentsPerHour * (1 + PAYROLL_BURDEN_RATE))
    : LOADED_WAGE_CENTS_PER_HOUR;

  const labourHours = pops / THROUGHPUT_POPS_PER_LABOUR_HOUR;
  const clockHours = labourHours / Math.max(1, headcount);

  const labourCents = Math.round(labourHours * loadedWage);
  const kitchenCents = Math.max(
    KITCHEN_MONTHLY_MINIMUM_CENTS,
    Math.round(clockHours * KITCHEN_CENTS_PER_HOUR)
  );
  const conversionCents = labourCents + kitchenCents;

  return {
    pops,
    labourHours,
    clockHours,
    clockHoursPerWeek: clockHours / WEEKS_PER_MONTH,
    hoursPerPersonPerWeek: clockHours / WEEKS_PER_MONTH,
    labourCents,
    kitchenCents,
    conversionCents,
    conversionCentsPerPop: pops > 0 ? conversionCents / pops : 0,
  };
}

/**
 * At-scale conversion cost per pop, used to seed the `inhouse` cost basis.
 * Taken at 8,120 pops/month — the December target — where the commissary
 * minimum has stopped distorting the per-unit number.
 */
export const AT_SCALE_CONVERSION_CENTS_PER_POP = 45;

/**
 * Monthly volume below which the commissary minimum makes conversion cost
 * per pop noticeably worse than the at-scale figure. Under this, expect
 * $0.50–0.70/pop rather than $0.45.
 */
export const CONVERSION_SCALE_THRESHOLD_POPS = 4000;
