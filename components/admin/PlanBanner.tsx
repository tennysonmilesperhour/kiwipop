'use client';

import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/format';
import {
  CLOSING_LEVERS,
  DECEMBER_SHORTFALL_CENTS,
  PLAN_MONTHS,
  SALARY_HEADCOUNT,
  SALARY_TARGET_CENTS,
  currentPlanMonth,
} from '@/lib/plan';

/* =========================================================
   PLAN BANNER
   =========================================================
   "Are we on track?" in one strip, so every admin page can
   answer it without the reader holding the plan in their head.

   `actualRevenueCents` / `actualDoors` are optional — pass what
   the page already has. Anything omitted renders as target-only
   rather than showing a fake zero.
   ========================================================= */

interface PlanBannerProps {
  /** Paid revenue in the current calendar month, if the page knows it. */
  actualRevenueCents?: number;
  /** Approved wholesale accounts, if the page knows it. */
  actualDoors?: number;
  /** Hide the levers footer on pages where it's noise. */
  compact?: boolean;
}

function pct(actual: number, target: number): number | null {
  if (!target) return null;
  return Math.round((actual / target) * 100);
}

function paceColor(percent: number | null): string {
  if (percent === null) return 'var(--admin-text-muted)';
  if (percent >= 90) return 'var(--c-lime)';
  if (percent >= 60) return 'var(--c-sodium)';
  return 'var(--c-magenta)';
}

export function PlanBanner({
  actualRevenueCents,
  actualDoors,
  compact = false,
}: PlanBannerProps): JSX.Element {
  const month = currentPlanMonth();
  const december = PLAN_MONTHS[PLAN_MONTHS.length - 1];

  const revenuePct =
    month && actualRevenueCents != null
      ? pct(actualRevenueCents, month.revenueCents)
      : null;
  const doorsPct =
    month && actualDoors != null ? pct(actualDoors, month.cumulativeDoors) : null;

  return (
    <div className="card mb-6" style={{ borderColor: 'var(--c-uv)' }}>
      <div className="flex justify-between items-center mb-3" style={{ gap: 12 }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          The plan · {month ? month.label : 'off-window'} 2026
        </h2>
        <Link
          href="https://github.com/tennysonmilesperhour/kiwipop/blob/main/docs/revenue-plan-2026.md"
          target="_blank"
          rel="noreferrer"
          className="text-sm"
          style={{ color: 'var(--c-cyan)' }}
        >
          read the plan →
        </Link>
      </div>

      {month === null ? (
        <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
          Today falls outside the Aug–Dec 2026 ramp. December target:{' '}
          <strong>{formatCentsToUSD(december.revenueCents)}</strong> revenue,{' '}
          <strong>{december.cumulativeDoors}</strong> doors,{' '}
          <strong>{december.pops.toLocaleString()}</strong> pops.
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">revenue · this month</p>
            <p className="text-lg font-bold">
              {actualRevenueCents != null
                ? formatCentsToUSD(actualRevenueCents)
                : '—'}
            </p>
            <p className="text-xs" style={{ color: paceColor(revenuePct) }}>
              target {formatCentsToUSD(month.revenueCents)}
              {revenuePct !== null ? ` · ${revenuePct}%` : ''}
            </p>
          </div>

          <div>
            <p className="text-gray-600">wholesale doors</p>
            <p className="text-lg font-bold">
              {actualDoors != null ? actualDoors : '—'}
            </p>
            <p className="text-xs" style={{ color: paceColor(doorsPct) }}>
              target {month.cumulativeDoors} · +{month.newDoors} this month
              {doorsPct !== null ? ` · ${doorsPct}%` : ''}
            </p>
          </div>

          <div>
            <p className="text-gray-600">pops to make</p>
            <p className="text-lg font-bold">{month.pops.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
              across every channel
            </p>
          </div>

          <div>
            <p className="text-gray-600">salary this month</p>
            <p className="text-lg font-bold">
              {month.salaryDrawCents > 0
                ? formatCentsToUSD(month.salaryDrawCents)
                : '—'}
            </p>
            <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
              {formatCentsToUSD(SALARY_TARGET_CENTS)}/mo across{' '}
              {SALARY_HEADCOUNT} by Dec
            </p>
          </div>
        </div>
      )}

      {!compact && DECEMBER_SHORTFALL_CENTS > 0 ? (
        <div
          className="mt-4 pt-3"
          style={{ borderTop: '1px solid var(--admin-border)' }}
        >
          <p className="text-sm mb-2">
            December lands at{' '}
            <strong>{formatCentsToUSD(december.availableForSalaryCents)}</strong>{' '}
            against the {formatCentsToUSD(SALARY_TARGET_CENTS)} target —{' '}
            <strong style={{ color: 'var(--c-sodium)' }}>
              {formatCentsToUSD(DECEMBER_SHORTFALL_CENTS)} short
            </strong>
            . These close it, and none of them require selling more:
          </p>
          <ul className="text-sm" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {CLOSING_LEVERS.map((lever) => (
              <li key={lever.label} style={{ marginBottom: 2 }}>
                <strong style={{ color: 'var(--c-lime)' }}>
                  {formatCentsToUSD(lever.monthlyValueCents)}/mo
                </strong>{' '}
                — {lever.label}{' '}
                <span style={{ color: 'var(--admin-text-muted)' }}>
                  ({lever.effort})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
