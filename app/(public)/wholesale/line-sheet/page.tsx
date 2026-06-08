import type { Metadata } from 'next';
import { formatCentsToUSD } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { FLAVORS, FUNCTIONALS } from '@/lib/flavors';
import { LineSheetActions } from './LineSheetActions';

const title = 'wholesale line sheet';
const description =
  'kiwi pop wholesale line sheet — brand, product lineup, tiered pricing, and ordering terms for boutiques, bars, and festival vendors.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/wholesale/line-sheet' },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface ProductLite {
  id: string;
  name: string;
  sku: string | null;
  price_cents: number;
}

interface PricingByProduct {
  productName: string;
  retailCents: number;
  standardCents?: number;
  premiumCents?: number;
}

async function loadPricing(): Promise<PricingByProduct[]> {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, sku, price_cents')
    .order('name');

  const { data: pricing } = await supabaseAdmin
    .from('wholesale_pricing')
    .select('product_id, tier, price_cents, min_quantity');

  if (!products) return [];

  const byProductId = new Map<string, PricingByProduct>();
  for (const product of products as ProductLite[]) {
    if (!product.sku?.startsWith('KP-')) continue;
    if (product.sku.startsWith('KP-PACK')) continue;
    byProductId.set(product.id, {
      productName: product.name,
      retailCents: product.price_cents,
    });
  }

  for (const row of pricing ?? []) {
    const entry = byProductId.get(row.product_id as string);
    if (!entry) continue;
    const cents = row.price_cents as number;
    if ((row.tier as string) === 'standard') entry.standardCents = cents;
    if ((row.tier as string) === 'premium') entry.premiumCents = cents;
  }

  return Array.from(byProductId.values());
}

export default async function WholesaleLineSheetPage(): Promise<JSX.Element> {
  const pricing = await loadPricing();
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
  // The shared functional base (everything except the per-flavor adaptogen row).
  const sharedBase = FUNCTIONALS.filter((f) => f.name !== 'adaptogen');

  return (
    <div className="ls-doc">
      <style>{lineSheetCss}</style>

      <header className="ls-head">
        <div>
          <div className="ls-brand">KIWI POP</div>
          <div className="ls-sub">Wholesale Line Sheet · {today}</div>
        </div>
        <div className="ls-contact">
          <div>thekiwipop@gmail.com</div>
          <div>kiwipop.fun/wholesale</div>
          <div>Salt Lake City, UT · USA</div>
        </div>
      </header>

      <p className="ls-lede">
        Lollipop-shaped party supplements. A glossy hard candy with a functional
        payload — built for boutiques, late-night bars, festival vendors, and
        gift shops that want something on the shelf nobody else has.
      </p>

      <div className="ls-stats">
        <div className="ls-stat">
          <strong>&lt;1g</strong>
          <span>sugar</span>
        </div>
        <div className="ls-stat">
          <strong>~35</strong>
          <span>calories</span>
        </div>
        <div className="ls-stat">
          <strong>Vegan</strong>
          <span>xylitol-sweetened</span>
        </div>
        <div className="ls-stat">
          <strong>Shelf-stable</strong>
          <span>individually foiled</span>
        </div>
      </div>

      <section className="ls-section">
        <h2 className="ls-h2">The lineup</h2>
        <div className="ls-flavors">
          {FLAVORS.map((f) => (
            <div className="ls-flavor" key={f.sku} style={{ '--dot': f.color } as React.CSSProperties}>
              <div className="ls-flavor-top">
                <span className="ls-dot" aria-hidden="true" />
                <span className="ls-flavor-name">{f.name}</span>
                <span
                  className={`ls-tag${f.status === 'live' ? ' ls-tag--live' : ''}`}
                >
                  {f.status === 'live' ? 'Available now' : 'Coming soon'}
                </span>
              </div>
              <div className="ls-flavor-profile">{f.flavor}</div>
              <div className="ls-flavor-fn">
                {f.adaptogen} · {f.direction}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ls-section">
        <h2 className="ls-h2">What&apos;s in every pop</h2>
        <p className="ls-note">
          The same functional base in every flavor, plus a per-flavor adaptogen
          tuned to the profile.
        </p>
        <ul className="ls-payload">
          {sharedBase.map((ing) => (
            <li key={ing.name}>
              <strong>{ing.name}</strong>
              <span>{ing.amount}</span>
            </li>
          ))}
          <li>
            <strong>adaptogen</strong>
            <span>tuned per flavor</span>
          </li>
        </ul>
      </section>

      <section className="ls-section">
        <h2 className="ls-h2">Wholesale pricing · per pop</h2>
        {pricing.length === 0 ? (
          <p className="ls-note">
            Tier pricing is being finalized — email us for current rates.
          </p>
        ) : (
          <table className="ls-table">
            <thead>
              <tr>
                <th>Flavor</th>
                <th>Retail (MSRP)</th>
                <th>Standard · 50+</th>
                <th>Premium · 200+</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((row) => (
                <tr key={row.productName}>
                  <td>{row.productName.toLowerCase()}</td>
                  <td>{formatCentsToUSD(row.retailCents)}</td>
                  <td>
                    {row.standardCents != null
                      ? formatCentsToUSD(row.standardCents)
                      : '—'}
                  </td>
                  <td>
                    {row.premiumCents != null
                      ? formatCentsToUSD(row.premiumCents)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="ls-section">
        <h2 className="ls-h2">Ordering terms</h2>
        <ul className="ls-terms">
          <li>
            <strong>Minimums.</strong> Standard tier opens at 50 units; premium
            pricing at 200 units. Mix and match flavors against the same tier.
          </li>
          <li>
            <strong>Lead time.</strong> Made to order in batches. Expect roughly
            2–3 weeks from confirmed PO to ship, with a heads-up before each
            festival drop.
          </li>
          <li>
            <strong>Reorders.</strong> Email{' '}
            <span className="ls-mono">thekiwipop@gmail.com</span> with flavors and
            quantities — we lock the batch and invoice.
          </li>
          <li>
            <strong>Getting started.</strong> Apply at{' '}
            <span className="ls-mono">kiwipop.fun/wholesale/apply</span> and we
            get back fast — usually within 2 business days.
          </li>
        </ul>
      </section>

      <footer className="ls-foot">
        <div>
          <strong>KIWI POP</strong> · thekiwipop@gmail.com · kiwipop.fun
        </div>
        <div className="ls-foot-note">
          Health is inevitable. Kindness is invincible.
        </div>
      </footer>

      <LineSheetActions />
    </div>
  );
}

const lineSheetCss = `
.ls-doc {
  max-width: 880px;
  margin: 0 auto;
  background: #ffffff;
  color: #14121a;
  padding: 48px 56px 96px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  line-height: 1.55;
}
.ls-doc * { box-sizing: border-box; }
.ls-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 3px solid #14121a;
  margin-bottom: 22px;
}
.ls-brand {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.ls-sub {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b6675;
  margin-top: 4px;
  font-weight: 600;
}
.ls-contact {
  text-align: right;
  font-size: 12.5px;
  color: #44404d;
}
.ls-contact > div + div { margin-top: 2px; }
.ls-lede {
  font-size: 15.5px;
  max-width: 640px;
  margin: 0 0 22px;
}
.ls-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}
.ls-stat {
  flex: 1 1 0;
  min-width: 140px;
  border: 1px solid #e3e0e8;
  border-radius: 10px;
  padding: 12px 14px;
  background: #faf9fc;
}
.ls-stat strong { display: block; font-size: 20px; font-weight: 800; }
.ls-stat span {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b6675;
}
.ls-section { margin-bottom: 30px; }
.ls-h2 {
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #14121a;
  font-weight: 800;
  margin: 0 0 12px;
  padding-bottom: 7px;
  border-bottom: 1px solid #14121a;
}
.ls-note { font-size: 13px; color: #6b6675; margin: 0 0 12px; }
.ls-flavors {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.ls-flavor {
  border: 1px solid #e3e0e8;
  border-radius: 10px;
  padding: 14px 16px;
}
.ls-flavor-top { display: flex; align-items: center; gap: 8px; }
.ls-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--dot, #a8ff3c);
  flex-shrink: 0;
}
.ls-flavor-name {
  font-weight: 700;
  font-size: 15px;
  text-transform: capitalize;
}
.ls-tag {
  margin-left: auto;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: #6b6675;
  border: 1px solid #d6d2dc;
  border-radius: 999px;
  padding: 2px 8px;
}
.ls-tag--live { color: #1d7a33; border-color: #9fd6ac; background: #effaf1; }
.ls-flavor-profile { font-size: 13.5px; margin-top: 8px; }
.ls-flavor-fn {
  font-size: 12px;
  color: #6b6675;
  margin-top: 3px;
  text-transform: capitalize;
}
.ls-payload {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 24px;
}
.ls-payload li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  padding: 5px 0;
  border-bottom: 1px solid #efedf3;
}
.ls-payload strong { font-weight: 600; text-transform: capitalize; }
.ls-payload span { color: #6b6675; text-align: right; }
.ls-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.ls-table th {
  text-align: left;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b6675;
  font-weight: 700;
  padding: 8px 10px;
  border-bottom: 2px solid #14121a;
}
.ls-table td { padding: 9px 10px; border-bottom: 1px solid #efedf3; }
.ls-table td:first-child { text-transform: capitalize; font-weight: 600; }
.ls-terms { margin: 0; padding-left: 18px; font-size: 13.5px; }
.ls-terms li { margin-bottom: 8px; }
.ls-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
.ls-foot {
  margin-top: 36px;
  padding-top: 16px;
  border-top: 1px solid #d6d2dc;
  font-size: 12.5px;
  color: #44404d;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.ls-foot-note { font-style: italic; color: #6b6675; }

@media (max-width: 640px) {
  .ls-doc { padding: 28px 20px 88px; }
  .ls-head { flex-direction: column; }
  .ls-contact { text-align: left; }
  .ls-flavors, .ls-payload { grid-template-columns: 1fr; }
}

@media print {
  @page { size: letter; margin: 0.5in; }
  html, body { background: #fff !important; }
  .ls-doc { padding: 0; max-width: none; }
  .ls-section { break-inside: avoid; }
  .ls-flavor { break-inside: avoid; }
}
`;
