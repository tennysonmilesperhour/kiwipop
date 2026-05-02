'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/format';
import type { FundraiserSnapshot } from '@/lib/fundraiser';

interface DonateFormProps {
  snapshot: FundraiserSnapshot;
}

const PRESETS = [5, 25, 50, 100, 250];
const VENMO_HANDLE = 'tennyson-taggart';

function buildVenmoUrl(amount: number): string {
  const note = encodeURIComponent('kiwi pop launch fundraiser');
  // venmo.com deep link — opens profile on web; the mobile app catches the
  // url and prefills amount + note in the pay sheet.
  return `https://venmo.com/u/${VENMO_HANDLE}?txn=pay&amount=${amount}&note=${note}`;
}

export function DonateForm({ snapshot }: DonateFormProps) {
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>('');

  const effectiveAmount = useMemo(() => {
    const n = Number(custom);
    if (custom && Number.isFinite(n) && n > 0) return Math.floor(n);
    return amount;
  }, [amount, custom]);

  const percent = Math.min(100, snapshot.percent);
  const venmoUrl = buildVenmoUrl(effectiveAmount);

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
          <div className="kp-fr-fill" style={{ width: `${Math.max(percent, 1.5)}%` }} />
        </div>
      </div>

      <section className="z2" style={{ display: 'block', minHeight: '70vh' }}>
        <div
          className="copy"
          style={{
            maxWidth: 980,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 340px)',
            gap: 40,
            alignItems: 'start',
          }}
        >
          <div>
            <span className="lab">contribute · venmo</span>
            <h2>
              SEND A
              <br />
              <span className="pk">DOLLAR.</span>
            </h2>
            <p className="lede" style={{ marginBottom: 32 }}>
              <span className="em">tip jar.</span> donations route through venmo to{' '}
              <strong>@{VENMO_HANDLE}</strong> for now — every dollar feeds
              the launch fundraiser at 100% of face value.
            </p>

            <div
              className="row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span className="ing">PICK AN AMOUNT</span>
              <span className="ing">
                <span className="mg">USD · VENMO</span>
              </span>
            </div>
            <div
              className="pack-pick"
              style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 18 }}
            >
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

            <div
              className="row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
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

            <a
              className="cta-take"
              href={venmoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                textDecoration: 'none',
              }}
            >
              <span>SEND {formatCentsToUSD(effectiveAmount * 100)}</span>
              <span>→ VENMO @{VENMO_HANDLE.toUpperCase()}</span>
            </a>

            <p className="lede" style={{ marginTop: 24, fontSize: 14 }}>
              the venmo link opens with the amount + a &ldquo;kiwi pop launch
              fundraiser&rdquo; note prefilled. mobile users get the app;
              desktop users land on the profile and can scan the qr.
            </p>

            <div
              style={{
                marginTop: 40,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <Link className="kp-fr-cta" href="/">
                ← BACK TO LANDING
              </Link>
              <Link className="kp-fr-cta pink" href="/wholesale/contact">
                WHOLESALE PREORDER →
              </Link>
            </div>
          </div>

          <a
            className="kp-venmo-card"
            href={`https://venmo.com/u/${VENMO_HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`open venmo profile @${VENMO_HANDLE}`}
            style={{ alignSelf: 'start' }}
          >
            <img
              src="/landing/img/venmo-qr.jpg"
              alt={`venmo qr · @${VENMO_HANDLE} · kiwi pop`}
              width={320}
              height={320}
            />
            <span className="kp-venmo-handle">venmo · @{VENMO_HANDLE}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
