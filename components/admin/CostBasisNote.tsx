'use client';

import Link from 'next/link';

/* =========================================================
   COST BASIS NOTE
   =========================================================
   The cost ladder in `products.cost_basis_cents` does not
   mean what its name suggests, and every margin in the admin
   inherits that. Until it's reconciled, say so on the pages
   where someone might act on the number.

   Findings, from the source workbook (docs/kiwi_pop_costing_v2.xlsx):

     - Its README states plainly that its per-pop figures are
       "ingredient cost only... doesn't include labor".
     - Its Scenario tab then applies a 0.40 labour + overhead
       multiplier on top.
     - Recomputing its own Tier-2 recipe at its own Tier-2
       prices gives $0.672/pop for Kiwi Pop. `diy_tier2` was
       seeded at $0.95. 0.672 x 1.4 = 0.941.

   So the DIY tiers already carry ~26-33c/pop of labour
   loading. The in-house production model then adds $0.45/pop
   of staff and kitchen on top — which counts labour twice.
   ========================================================= */

interface CostBasisNoteProps {
  /** Drop the detail and render a single line. */
  compact?: boolean;
}

export function CostBasisNote({
  compact = false,
}: CostBasisNoteProps): JSX.Element {
  return (
    <div
      className="card mb-6"
      style={{ borderColor: 'var(--c-sodium)' }}
    >
      <h2 className="card-title" style={{ margin: '0 0 0.5rem' }}>
        ⚠ Cost basis is under review — labour is counted twice
      </h2>

      <p className="text-sm mb-2">
        The <code>diy_tier1/2/3</code> figures are <strong>not</strong>{' '}
        materials-only, despite reading that way. They came from the{' '}
        <Link
          href="https://github.com/tennysonmilesperhour/kiwipop/blob/main/docs/kiwi_pop_costing_v2.xlsx"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--c-cyan)' }}
        >
          v2 costing workbook
        </Link>
        , which applies a <strong>40% labour + overhead multiplier</strong> on
        top of ingredient cost. Recomputing its Tier-2 recipe gives{' '}
        <strong>$0.672/pop</strong>; <code>diy_tier2</code> was seeded at{' '}
        <strong>$0.95</strong>. 0.672 × 1.4 = 0.941.
      </p>

      {compact ? null : (
        <>
          <p className="text-sm mb-2">
            So each tier carries roughly <strong>26–33¢/pop of labour</strong>{' '}
            already. The in-house production model then adds{' '}
            <strong>$0.45/pop</strong> of staff and commissary rent on top —{' '}
            <strong style={{ color: 'var(--c-sodium)' }}>
              counting labour twice, about 26¢/pop
            </strong>
            . At December volume that is roughly{' '}
            <strong>$2,100/month</strong> of overstated cost, which is more than
            the December salary shortfall.
          </p>
          <p className="text-sm mb-2">
            The rest of the spread between the live bill of materials (~$0.55)
            and <code>diy_tier2</code> ($0.90) is recipe drift — the database
            doses are far smaller than the workbook&apos;s on the expensive
            lines (jambu 0.05 g → 0.005 g, glitter 0.1 g → 0.05 g, spirulina
            0.5 g → 0.05 g). The tiers were never recomputed after the formula
            changed.
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--admin-text-muted)', margin: 0 }}
          >
            <strong>Pending decision:</strong> redefine the bases as
            materials-only, computed live from the BOM, and let{' '}
            <code>lib/production-cost.ts</code> carry labour exactly once. Until
            that lands, treat every margin shown in the admin as{' '}
            <strong>conservative</strong> — real margin is likely better. See{' '}
            <Link
              href="https://github.com/tennysonmilesperhour/kiwipop/blob/main/docs/open-items.md"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--c-cyan)' }}
            >
              open-items §4
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
