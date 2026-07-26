'use client';

import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/format';
import {
  KITCHEN_CENTS_PER_HOUR,
  KITCHEN_MONTHLY_MINIMUM_CENTS,
  LINE_HEADCOUNT,
  LOADED_WAGE_CENTS_PER_HOUR,
  PAYROLL_BURDEN_RATE,
  THROUGHPUT_POPS_PER_LABOUR_HOUR,
  WAGE_CENTS_PER_HOUR,
  productionMonth,
} from '@/lib/production-cost';
import { PLAN_MONTHS, currentPlanMonth } from '@/lib/plan';

/* =========================================================
   PRODUCTION PLAN CARD
   =========================================================
   What this month's plan volume costs to actually make, on
   the staffed commissary line that replaced the co-packer.

   The distinction the card exists to make visible: LABOUR
   scales with person-hours, KITCHEN RENT scales with clock-
   hours. Three people on a line burn three person-hours per
   hour of rent, which is why the weekly booking is so much
   smaller than the payroll number implies.
   ========================================================= */

export function ProductionPlanCard(): JSX.Element {
  const month = currentPlanMonth() ?? PLAN_MONTHS[PLAN_MONTHS.length - 1];
  const run = productionMonth(month.pops);
  const availablePersonHours = LINE_HEADCOUNT * 10 * 4.33;
  const utilisation = Math.round(
    (run.labourHours / availablePersonHours) * 100
  );

  return (
    <div className="card mb-6" style={{ borderColor: 'var(--c-cyan)' }}>
      <div className="flex justify-between items-center mb-3" style={{ gap: 12 }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          Production plan · {month.label} · {month.pops.toLocaleString()} pops
        </h2>
        <Link
          href="https://github.com/tennysonmilesperhour/kiwipop/blob/main/docs/production-staffing-plan.md"
          target="_blank"
          rel="noreferrer"
          className="text-sm"
          style={{ color: 'var(--c-cyan)' }}
        >
          staffing plan →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-600">paid person-hours</p>
          <p className="text-lg font-bold">{Math.round(run.labourHours)}</p>
          <p
            className="text-xs"
            style={{
              color:
                utilisation > 95
                  ? 'var(--c-magenta)'
                  : utilisation > 80
                  ? 'var(--c-sodium)'
                  : 'var(--admin-text-muted)',
            }}
          >
            {utilisation}% of {Math.round(availablePersonHours)} available
            ({LINE_HEADCOUNT} × 10 hrs/wk)
          </p>
        </div>
        <div>
          <p className="text-gray-600">kitchen clock-hours</p>
          <p className="text-lg font-bold">{Math.round(run.clockHours)}</p>
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
            ≈ {run.clockHoursPerWeek.toFixed(1)} hrs/week to book
          </p>
        </div>
        <div>
          <p className="text-gray-600">labour + kitchen</p>
          <p className="text-lg font-bold">
            {formatCentsToUSD(run.conversionCents)}
          </p>
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
            {formatCentsToUSD(run.labourCents)} staff +{' '}
            {formatCentsToUSD(run.kitchenCents)} rent
            {run.kitchenCents === KITCHEN_MONTHLY_MINIMUM_CENTS
              ? ' (minimum)'
              : ''}
          </p>
        </div>
        <div>
          <p className="text-gray-600">conversion / pop</p>
          <p className="text-lg font-bold">
            {formatCentsToUSD(Math.round(run.conversionCentsPerPop))}
          </p>
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
            settles at ~$0.45 above 4,000/mo
          </p>
        </div>
      </div>

      <p
        className="text-sm"
        style={{ color: 'var(--admin-text-muted)', margin: 0 }}
      >
        Assumes <strong>{THROUGHPUT_POPS_PER_LABOUR_HOUR} pops per
        person-hour</strong> on a {LINE_HEADCOUNT}-person parallel line, wages at{' '}
        {formatCentsToUSD(WAGE_CENTS_PER_HOUR)}/hr +{' '}
        {Math.round(PAYROLL_BURDEN_RATE * 100)}% employer burden (
        {formatCentsToUSD(LOADED_WAGE_CENTS_PER_HOUR)}/hr loaded), and commissary
        at {formatCentsToUSD(KITCHEN_CENTS_PER_HOUR)}/clock-hour with a{' '}
        {formatCentsToUSD(KITCHEN_MONTHLY_MINIMUM_CENTS)}/month minimum.{' '}
        <strong style={{ color: 'var(--c-sodium)' }}>
          Throughput is an estimate, not a measurement
        </strong>{' '}
        — measure it on the first three real sessions and correct{' '}
        <code>lib/production-cost.ts</code>. Everything on this card is
        downstream of it.
      </p>
    </div>
  );
}
