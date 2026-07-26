'use client';

import Link from 'next/link';
import {
  DOOR_OPENING_POPS,
  DOOR_REORDER_POPS,
  DOOR_SENSITIVITY,
  PLAN_MONTHS,
  currentPlanMonth,
} from '@/lib/plan';
import { TIER_META } from '@/lib/wholesale-tiers';
import { formatCentsToUSD } from '@/lib/format';

/* =========================================================
   DOOR PIPELINE
   =========================================================
   The plan lives or dies on one number: retail doors signed,
   and how many of them reorder. This card puts the target,
   the actual, and the sensitivity in front of whoever is
   approving accounts.

   Door productivity (avg monthly reorder) is the least-tested
   assumption in the entire model — at 25 pops/month instead
   of 60, the plan needs 112 doors rather than 56. The first
   six accounts' reorders are the earliest reliable signal
   we will get, so the sensitivity table lives here.
   ========================================================= */

interface DoorPipelineProps {
  approvedDoors: number;
  pendingDoors: number;
}

export function DoorPipeline({
  approvedDoors,
  pendingDoors,
}: DoorPipelineProps): JSX.Element {
  const month = currentPlanMonth();
  const december = PLAN_MONTHS[PLAN_MONTHS.length - 1];
  const target = month?.cumulativeDoors ?? december.cumulativeDoors;
  const behind = Math.max(0, target - approvedDoors);

  const openingValueCents = DOOR_OPENING_POPS * TIER_META.standard.targetPriceCents;
  const reorderValueCents = DOOR_REORDER_POPS * TIER_META.standard.targetPriceCents;

  return (
    <div className="card mb-6" style={{ borderColor: 'var(--c-magenta)' }}>
      <div className="flex justify-between items-center mb-3" style={{ gap: 12 }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          Door pipeline
        </h2>
        <Link
          href="https://github.com/tennysonmilesperhour/kiwipop/blob/main/docs/sales-commission-plan.md"
          target="_blank"
          rel="noreferrer"
          className="text-sm"
          style={{ color: 'var(--c-cyan)' }}
        >
          commission plan →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-600">approved doors</p>
          <p className="text-lg font-bold">{approvedDoors}</p>
          <p
            className="text-xs"
            style={{
              color: behind > 0 ? 'var(--c-magenta)' : 'var(--c-lime)',
            }}
          >
            {behind > 0
              ? `${behind} behind ${month?.label ?? 'Dec'} target of ${target}`
              : `at or ahead of target (${target})`}
          </p>
        </div>
        <div>
          <p className="text-gray-600">pending applications</p>
          <p className="text-lg font-bold">{pendingDoors}</p>
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
            approve to mint their referral codes
          </p>
        </div>
        <div>
          <p className="text-gray-600">opening order</p>
          <p className="text-lg font-bold">
            {formatCentsToUSD(openingValueCents)}
          </p>
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
            {DOOR_OPENING_POPS} pops @ {formatCentsToUSD(TIER_META.standard.targetPriceCents)} · display free
          </p>
        </div>
        <div>
          <p className="text-gray-600">steady reorder</p>
          <p className="text-lg font-bold">
            {formatCentsToUSD(reorderValueCents)}/mo
          </p>
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
            {DOOR_REORDER_POPS} pops — ~2/day off the counter
          </p>
        </div>
      </div>

      <p className="text-sm mb-2">
        <strong>Reorder rate is the assumption most likely to be wrong.</strong>{' '}
        The plan needs {DOOR_REORDER_POPS} pops/month per door. Measure it on
        the first six accounts — it is the earliest reliable signal available,
        and it should reset the whole forecast:
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="table text-sm" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Avg reorder / door / month</th>
              <th>Doors needed for December</th>
            </tr>
          </thead>
          <tbody>
            {DOOR_SENSITIVITY.map((row) => {
              const isPlan = row.reorderPops === DOOR_REORDER_POPS;
              return (
                <tr key={row.reorderPops}>
                  <td style={{ fontWeight: isPlan ? 700 : 400 }}>
                    {row.reorderPops} pops{isPlan ? ' · the plan' : ''}
                  </td>
                  <td
                    style={{
                      fontWeight: isPlan ? 700 : 400,
                      color:
                        row.doorsNeeded > 80
                          ? 'var(--c-magenta)'
                          : isPlan
                          ? 'var(--c-lime)'
                          : undefined,
                    }}
                  >
                    {row.doorsNeeded}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p
        className="text-sm"
        style={{ color: 'var(--admin-text-muted)', margin: '0.75rem 0 0' }}
      >
        At 25 pops/month the plan does not work on doors alone and has to lean
        on distributors and events instead.
      </p>
    </div>
  );
}
