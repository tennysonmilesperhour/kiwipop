'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/store';
import { formatCentsToUSD } from '@/lib/format';
import type { ProductRow } from '@/lib/landing-products';
import type { FundraiserSnapshot } from '@/lib/fundraiser';

interface DonateFormProps {
  product: ProductRow | null;
  snapshot: FundraiserSnapshot;
}

const PRESETS = [5, 25, 50, 100, 250];

export function DonateForm({ product, snapshot }: DonateFormProps) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const effectiveAmount = (() => {
    const n = Number(custom);
    if (custom && Number.isFinite(n) && n > 0) return Math.floor(n);
    return amount;
  })();

  const percent = Math.min(100, snapshot.percent);

  const handleDonate = () => {
    if (!product || submitting || effectiveAmount <= 0) return;
    setSubmitting(true);
    addItem({
      productId: product.id,
      name: `${product.name} · ${formatCentsToUSD(effectiveAmount * 100)}`,
      price: product.price_cents, // $1/unit, quantity = dollars
      quantity: effectiveAmount,
      image: undefined,
      isPreorder: false,
    });
    router.push('/cart');
  };

  return (
    <div className="kp-page" style={{ minHeight: '100vh' }}>
      <div className="kp-fundraiser" style={{ position: 'static' }}>
        <div className="kp-fr-row">
          <span className="kp-fr-label">
            <span className="cn">舐</span>
            KIWI POP LAUNCH FUNDRAISER
          </span>
          <span className="kp-fr-amount">
            <span className="raised">{formatCentsToUSD(snapshot.raisedCents)}</span>
            <span className="of">/</span>
            {formatCentsToUSD(snapshot.goalCents)}
            <span className="pct">{percent < 1 ? '<1%' : `${Math.round(percent)}%`} FUNDED</span>
          </span>
        </div>
        <div className="kp-fr-track">
          <div className="kp-fr-fill" style={{ width: `${Math.max(percent, 0.5)}%` }} />
        </div>
      </div>

      <section className="z2" style={{ display: 'block', minHeight: '70vh' }}>
        <div className="copy" style={{ maxWidth: 720, margin: '0 auto' }}>
          <span className="lab">contribute</span>
          <h2>
            DROP A
            <br />
            <span className="pk">DOLLAR.</span>
          </h2>
          <p className="lede" style={{ marginBottom: 32 }}>
            <span className="em">tip jar.</span> every dollar feeds the launch — packaging, kava, blue spirulina, a kid in new shibuya rolling 800 pops by hand. ships nothing. counts toward the {formatCentsToUSD(snapshot.goalCents)} goal at 100% of face value.
          </p>

          {!product ? (
            <p className="lede" style={{ color: 'var(--hot-pink)' }}>
              donations aren&apos;t live yet. run migration 008 in the supabase project to seed the donation product.
            </p>
          ) : (
            <>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="ing">PICK AN AMOUNT</span>
                <span className="ing"><span className="mg">USD</span></span>
              </div>
              <div className="pack-pick" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 18 }}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`pack-opt${!custom && amount === preset ? ' on' : ''}`}
                    onClick={() => {
                      setAmount(preset);
                      setCustom('');
                    }}
                    aria-pressed={!custom && amount === preset}
                  >
                    <span className="sz">${preset}</span>
                  </button>
                ))}
              </div>

              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ing">OR ENTER A CUSTOM AMOUNT</span>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="custom · whole dollars"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(245, 255, 61, 0.4)',
                  color: 'var(--bone)',
                  fontFamily: 'var(--font-cyber)',
                  fontWeight: 500,
                  fontSize: 14,
                  letterSpacing: '0.12em',
                  marginBottom: 24,
                }}
                aria-label="custom donation amount in dollars"
              />

              <button
                type="button"
                className="cta-take"
                onClick={handleDonate}
                disabled={submitting || effectiveAmount <= 0}
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>CONTRIBUTE {formatCentsToUSD(effectiveAmount * 100)}</span>
                <span>→ CART</span>
              </button>

              <p className="lede" style={{ marginTop: 24, fontSize: 14 }}>
                no goods ship. processed via stripe through the same checkout as a sale, so it counts toward the live progress bar instantly on payment.
              </p>
            </>
          )}

          <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="kp-fr-cta" href="/">
              ← BACK TO LANDING
            </Link>
            <Link className="kp-fr-cta pink" href="/wholesale/apply">
              WHOLESALE PREORDER →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
