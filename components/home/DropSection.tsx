'use client';

import Link from 'next/link';
import { useProducts } from '@/lib/hooks';
import { FLAVORS } from '@/lib/flavors';

interface ProductRow {
  id: string;
  sku: string | null;
  name: string;
  price_cents: number;
  preorder_only: boolean;
}

export function DropSection() {
  const { data: products } = useProducts();
  const productsBySku: Record<string, ProductRow> = {};
  for (const p of (products ?? []) as ProductRow[]) {
    if (p.sku) productsBySku[p.sku] = p;
  }

  return (
    <section className="drop-section" id="drop">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/01</span>the drop
        </div>
        <div className="section-meta">
          one live · three on preorder · five cal each · zero sugar
        </div>
      </div>

      <div className="flavor-grid">
        {FLAVORS.map((flavor, idx) => {
          const product = productsBySku[flavor.sku];
          const isLive = flavor.status === 'live';
          // Both live and preorder products link to their product detail page
          // when the row exists in the DB. Preorder products show a preorder
          // CTA there. If no product row exists yet (DB hasn't been seeded),
          // we drop preorder cards onto the email list instead.
          const href = product ? `/products/${product.id}` : '#list';
          const displayLines = flavor.display.split('\n');
          return (
            <Link
              key={flavor.sku}
              href={href}
              className="flavor-card"
              style={{ '--c': flavor.color } as React.CSSProperties}
              aria-label={`${flavor.name} — ${isLive ? 'shop' : 'preorder'}`}
              data-status={flavor.status}
            >
              <div className="flavor-top">
                <div className="flavor-num">
                  flavor 0{idx + 1} / 04 · {isLive ? 'live' : 'preorder'}
                </div>
                <div className="flavor-name">
                  {displayLines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < displayLines.length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flavor-bottom">
                <div className="flavor-feeling">{flavor.feeling}</div>
                <div className="flavor-fn">{flavor.flavor}</div>
                {isLive && product ? (
                  <div className="flavor-price">
                    ${(product.price_cents / 100).toFixed(2)} · shop ↗
                  </div>
                ) : product ? (
                  <div className="flavor-price">
                    ${(product.price_cents / 100).toFixed(2)} · preorder ↗
                  </div>
                ) : (
                  <div className="flavor-price">notify me ↗</div>
                )}
              </div>
              {!isLive && (
                <div className="flavor-soon-overlay" aria-hidden="true">
                  preorder
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
