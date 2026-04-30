'use client';

import Link from 'next/link';
import { useProducts } from '@/lib/hooks';
import { FLAVORS } from '@/lib/flavors';

interface ProductRow {
  id: string;
  sku: string | null;
  name: string;
  price_cents: number;
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
        <div className="section-meta">4 flavors · 4 feelings · 800 made each</div>
      </div>

      <div className="flavor-grid">
        {FLAVORS.map((flavor, idx) => {
          const product = productsBySku[flavor.sku];
          const href = product ? `/products/${product.id}` : '#drop';
          const displayLines = flavor.display.split('\n');
          return (
            <Link
              key={flavor.sku}
              href={href}
              className="flavor-card"
              style={{ '--c': flavor.color } as React.CSSProperties}
              aria-label={`shop ${flavor.name}`}
            >
              <div className="flavor-top">
                <div className="flavor-num">flavor 0{idx + 1} / 04</div>
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
                <div className="flavor-fn">{flavor.fn}</div>
                {product ? (
                  <div className="flavor-price">
                    ${(product.price_cents / 100).toFixed(2)} · shop ↗
                  </div>
                ) : (
                  <div className="flavor-price">drop incoming</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
