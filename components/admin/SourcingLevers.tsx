'use client';

import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/format';
import { CLOSING_LEVERS } from '@/lib/plan';

/* =========================================================
   SOURCING LEVERS
   =========================================================
   The buying decisions that are worth real money, on the page
   where buying decisions get made.

   Two ingredients are ~63% of the cost of a pop — isomalt and
   the glitter. Every functional active combined is under 5c.
   That single fact should drive every sourcing decision, and
   it is not obvious from a flat list of 30 materials.
   ========================================================= */

interface Lever {
  material: string;
  now: string;
  target: string;
  saving: string;
  action: string;
  done?: boolean;
}

const INGREDIENT_LEVERS: Lever[] = [
  {
    material: 'Isomalt',
    now: '$0.0164/g (LorAnn 10 lb)',
    target: '$0.0107/g (Bakers Authority 45 lb, $218.10)',
    saving: '−8.6¢/pop',
    action: 'Confirm the $218.10 in a browser, then order',
    done: true,
  },
  {
    material: 'Edible luster dust',
    now: '0.05 g @ $1.00/g = 5.0¢',
    target: '~$0.37/g at Bakell 1 kg tier → ~1.9¢',
    saving: '−3.1¢/pop',
    action: 'Email Bakell for the 1 kg case price',
  },
  {
    material: 'Foil wrapper',
    now: '4.0¢ — 6-colour pack, 2 colours wasted',
    target: 'single-colour packs → ~2.7¢, bulk roll → ~1.5¢',
    saving: '−1.3 to −2.5¢/pop',
    action: 'Stop buying the 6-colour pack',
  },
  {
    material: 'Label sticker',
    now: '3.9¢ (200-packs)',
    target: '~1.5¢ (OnlineLabels 1,000+ roll)',
    saving: '−2.4¢/pop',
    action: 'One order',
  },
  {
    material: 'Magnesium glycinate',
    now: '$0.046/g',
    target: '$0.015/g (BulkSupplements 25 kg)',
    saving: '−0.9¢/pop',
    action: 'Add to the tier-3 order',
  },
  {
    material: 'Lemon powder (Lemon SKU)',
    now: '$0.057/g',
    target: '$0.019/g (BulkSupplements 25 kg)',
    saving: '−3.8¢ on that SKU',
    action: 'Add to the tier-3 order',
  },
];

export function SourcingLevers(): JSX.Element {
  return (
    <div className="card mb-6" style={{ borderColor: 'var(--c-lime)' }}>
      <div className="flex justify-between items-center mb-2" style={{ gap: 12 }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          Sourcing levers — where the money actually is
        </h2>
        <Link
          href="https://github.com/tennysonmilesperhour/kiwipop/blob/main/docs/ingredient-sourcing.md"
          target="_blank"
          rel="noreferrer"
          className="text-sm"
          style={{ color: 'var(--c-cyan)' }}
        >
          sourcing doc →
        </Link>
      </div>

      <p className="text-sm mb-3">
        <strong>Isomalt and the glitter are ~63% of the cost of a pop.</strong>{' '}
        Every functional active combined — theobromine, ginseng, taurine,
        magnesium, turmeric, spirulina — is under 5¢. The payload is
        effectively free; the candy base and the sparkle are the whole cost
        problem. Attack those two before anything else.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="table text-sm" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Now</th>
              <th>Target</th>
              <th>Saving</th>
              <th>Next action</th>
            </tr>
          </thead>
          <tbody>
            {INGREDIENT_LEVERS.map((lever) => (
              <tr key={lever.material}>
                <td style={{ fontWeight: 600 }}>
                  {lever.done ? '✅ ' : ''}
                  {lever.material}
                </td>
                <td style={{ color: 'var(--admin-text-muted)' }}>{lever.now}</td>
                <td>{lever.target}</td>
                <td style={{ color: 'var(--c-lime)', fontWeight: 600 }}>
                  {lever.saving}
                </td>
                <td style={{ color: 'var(--admin-text-muted)' }}>
                  {lever.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        className="text-sm mt-3"
        style={{ color: 'var(--admin-text-muted)', margin: '0.75rem 0 0' }}
      >
        Together with line throughput these are worth{' '}
        <strong style={{ color: 'var(--c-lime)' }}>
          {formatCentsToUSD(
            CLOSING_LEVERS.reduce((s, l) => s + l.monthlyValueCents, 0)
          )}
          /month
        </strong>{' '}
        at December volume — more than enough to close the salary shortfall
        without selling a single extra pop.
      </p>

      <p
        className="text-sm"
        style={{ color: 'var(--admin-text-muted)', margin: '0.5rem 0 0' }}
      >
        <strong>Two prices still need a human to confirm them:</strong> the
        isomalt at $218.10/45 lb (the whole tier-3 path rests on it) and the
        foil pack at ~$15.99. Twelve ingredient costs are documented estimates
        rather than invoices — only ashwagandha (3.0¢), caramel flavour (3.8¢)
        and apple powder (2.7¢) are large enough to be worth a special trip.
      </p>
    </div>
  );
}
