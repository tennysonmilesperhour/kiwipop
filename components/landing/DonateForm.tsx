'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { formatCentsToUSD } from '@/lib/format';
import type { ProductRow } from '@/lib/landing-products';
import type { FundraiserSnapshot } from '@/lib/fundraiser';

interface DonateFormProps {
  product: ProductRow | null;
  snapshot: FundraiserSnapshot;
}

interface DonateResponse {
  checkoutUrl?: string;
  error?: string;
  details?: string;
}

const PRESETS = [5, 25, 50, 100, 250];
const MAX_MESSAGE_LEN = 500;

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(0, 0, 0, 0.45)',
  border: '1px solid rgba(245, 255, 61, 0.4)',
  color: 'var(--bone)',
  fontFamily: 'var(--font-cyber)',
  fontWeight: 500,
  fontSize: 14,
  letterSpacing: '0.12em',
};

export function DonateForm({ product, snapshot }: DonateFormProps) {
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const effectiveAmount = (() => {
    const n = Number(custom);
    if (custom && Number.isFinite(n) && n > 0) return Math.floor(n);
    return amount;
  })();

  const percent = Math.min(100, snapshot.percent);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || submitting || effectiveAmount <= 0) return;
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/donate-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountDollars: effectiveAmount,
          email,
          name: name || undefined,
          message: message || undefined,
        }),
      });
      const json = (await response.json()) as DonateResponse;
      if (!response.ok || !json.checkoutUrl) {
        throw new Error(json.error ?? 'could not start checkout — try again.');
      }
      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not start checkout');
      setSubmitting(false);
    }
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
            <span className="em">tip jar.</span> every dollar feeds the launch — packaging, kava, blue spirulina, batch labor in salt lake hand-rolling 800 pops at a time. ships nothing. counts toward the {formatCentsToUSD(snapshot.goalCents)} goal at 100% of face value.
          </p>

          {!product ? (
            <p className="lede" style={{ color: 'var(--hot-pink)' }}>
              donations aren&apos;t live yet. run migration 008 in the supabase project to seed the donation product.
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
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
                style={fieldStyle}
                aria-label="custom donation amount in dollars"
              />

              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
                <span className="ing">EMAIL · WE&apos;LL SEND A RECEIPT</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@somewhere.cool"
                autoComplete="email"
                style={fieldStyle}
                aria-label="email for receipt"
              />

              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
                <span className="ing">NAME · OPTIONAL · HOW TO CREDIT YOU</span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="anonymous works too"
                autoComplete="name"
                style={fieldStyle}
                aria-label="name (optional)"
              />

              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
                <span className="ing">LEAVE A MESSAGE · OPTIONAL</span>
                <span className="ing"><span className="mg">{message.length} / {MAX_MESSAGE_LEN}</span></span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LEN))}
                placeholder="hype, advice, lyrics, threats — read by a real human."
                rows={4}
                style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit', marginBottom: 24 }}
                aria-label="message (optional)"
              />

              {error ? (
                <p
                  className="lede"
                  role="alert"
                  aria-live="polite"
                  style={{ color: 'var(--hot-pink)', marginBottom: 16, fontSize: 14 }}
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="cta-take"
                disabled={submitting || effectiveAmount <= 0 || !email}
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>{submitting ? 'REDIRECTING TO STRIPE…' : `CONTRIBUTE ${formatCentsToUSD(effectiveAmount * 100)}`}</span>
                <span>→ PAY</span>
              </button>

              <p className="lede" style={{ marginTop: 24, fontSize: 14 }}>
                no shipping needed. processed via stripe — counts toward the live progress bar instantly on payment.
              </p>
            </form>
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
