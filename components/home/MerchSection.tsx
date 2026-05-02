'use client';

import { useState } from 'react';
import { MERCH } from '@/lib/merch';

export function MerchSection() {
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const buy = async (slug: string) => {
    setError('');
    setBusySlug(slug);
    try {
      const response = await fetch('/api/merch-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, quantity: 1 }),
      });
      const json = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !json.checkoutUrl) {
        throw new Error(json.error ?? 'could not start checkout — try again.');
      }
      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not start checkout');
      setBusySlug(null);
    }
  };

  return (
    <section className="merch-section" id="merch">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/03</span>the merch
        </div>
        <div className="section-meta">
          fundraiser drop · five tees · every dollar funds the launch
        </div>
      </div>

      {error ? (
        <p
          className="merch-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      <div className="flavor-grid merch-grid">
        {MERCH.map((item) => {
          const lines = item.display.split('\n');
          const isBusy = busySlug === item.slug;
          return (
            <div
              key={item.slug}
              className="flavor-card merch-card"
              style={{ '--c': item.color } as React.CSSProperties}
            >
              <div className="flavor-top">
                <div className="flavor-num">
                  merch 0{item.num.replace('/', '')} / 05 · placeholder
                </div>
                <div className="flavor-name">
                  {lines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < lines.length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flavor-bottom">
                <div className="flavor-feeling">{item.kind}</div>
                <div className="flavor-fn">{item.blurb}</div>
                <div className="flavor-price">
                  ${(item.priceCents / 100).toFixed(2)} · ships when printed
                </div>
                <button
                  type="button"
                  className="merch-buy"
                  onClick={() => buy(item.slug)}
                  disabled={isBusy}
                  aria-label={`buy ${item.name}`}
                >
                  {isBusy ? 'redirecting…' : 'buy now ↗'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="merch-fineprint">
        // every tee = one less spreadsheet panic. thanks for funding the drop.
      </p>
    </section>
  );
}
