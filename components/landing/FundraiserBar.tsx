'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FundraiserSnapshot } from '@/lib/fundraiser';
import type { ProductRow } from '@/lib/landing-products';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';

interface FundraiserBarProps {
  snapshot: FundraiserSnapshot;
  varietyHalfOff: ProductRow | null;
}

export function FundraiserBar({ snapshot, varietyHalfOff }: FundraiserBarProps) {
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const percentLabel = snapshot.percent < 1 ? '<1%' : `${Math.round(snapshot.percent)}%`;

  const handleHalfOff = () => {
    if (!varietyHalfOff || adding) return;
    setAdding(true);
    addItem({
      productId: varietyHalfOff.id,
      name: varietyHalfOff.name,
      price: varietyHalfOff.price_cents,
      quantity: 1,
      image: varietyHalfOff.image_url ?? undefined,
      isPreorder: varietyHalfOff.preorder_only,
    });
    router.push('/cart');
  };

  return (
    <div className="kp-fundraiser" role="region" aria-label="launch fundraiser progress">
      <div className="kp-fr-row">
        <span className="kp-fr-label">
          <span className="cn">舐</span>
          KIWI POP LAUNCH FUNDRAISER · EVERY SALE COUNTS
        </span>
        <span className="kp-fr-amount">
          <span className="raised">{formatCentsToUSD(snapshot.raisedCents)}</span>
          <span className="of">/</span>
          {formatCentsToUSD(snapshot.goalCents)}
          <span className="pct">{percentLabel} FUNDED</span>
        </span>
      </div>

      <div
        className="kp-fr-track"
        role="progressbar"
        aria-valuenow={snapshot.raisedCents}
        aria-valuemin={0}
        aria-valuemax={snapshot.goalCents}
        aria-valuetext={`${formatCentsToUSD(snapshot.raisedCents)} raised of ${formatCentsToUSD(snapshot.goalCents)}`}
      >
        <div className="kp-fr-fill" style={{ width: `${Math.max(snapshot.percent, 0.5)}%` }} />
      </div>

      <div className="kp-fr-ctas">
        <Link className="kp-fr-cta primary" href="/donate">
          DONATE → CONTRIBUTE
        </Link>
        <button
          type="button"
          className="kp-fr-cta pink"
          onClick={handleHalfOff}
          disabled={!varietyHalfOff || adding}
          aria-disabled={!varietyHalfOff || adding}
        >
          {adding
            ? 'ADDING…'
            : varietyHalfOff
              ? `HALF-OFF VARIETY 12-PACK · PREORDER · ${formatCentsToUSD(varietyHalfOff.price_cents)}`
              : 'HALF-OFF VARIETY 12-PACK · PREORDER'}
        </button>
        <Link className="kp-fr-cta" href="/wholesale/apply">
          WHOLESALE PREORDER · FUNDRAISER SPECIAL →
        </Link>
      </div>

      <div className="kp-fr-flash">
        <span className="em">LIMITED-TIME PREORDER</span> · $3 / pop · 6 + 12 packs ship at half off until the goal hits {formatCentsToUSD(snapshot.goalCents)} · wholesale preorder open as a fundraiser special
      </div>
    </div>
  );
}
