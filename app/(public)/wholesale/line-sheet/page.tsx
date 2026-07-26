import type { Metadata } from 'next';
import { formatCentsToUSD } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { FLAVORS, FUNCTIONALS, TIMELINE } from '@/lib/flavors';
import { LineSheetActions } from './LineSheetActions';

const title = 'wholesale brand & price sheet';
const description =
  'kiwi pop wholesale brand & price sheet — brand story, product lineup, formulation, tiered pricing, and ordering terms for boutiques, bars, and festival vendors.';

/**
 * The "lead with the no's" formulation claims that anchor the brand sheet.
 * Clean-label positioning a health-conscious buyer can repeat to their own
 * customers — each `no` is the headline, `what` the substitution, `why` the
 * one-line justification.
 */
const FORMULATION_CLAIMS = [
  {
    no: 'No corn syrup',
    what: 'xylitol + monk fruit',
    why: 'Isomalt base, tooth-friendly and low-glycemic. Under 1g sugar.',
  },
  {
    no: 'No artificial dyes',
    what: 'color from botanicals',
    why: 'Spirulina, turmeric, matcha, and lucuma do the color — never artificial dye.',
  },
  {
    no: 'No caffeine crash',
    what: 'theobromine, not caffeine',
    why: 'A smooth lift from theobromine plus a per-flavor adaptogen. Lifted, not wired.',
  },
] as const;

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
    .select('id, name, sku, price_cents');

  const { data: pricing } = await supabaseAdmin
    .from('wholesale_pricing')
    .select('product_id, tier, price_cents');

  if (!products) return [];

  // Index single-pop products by SKU and tier pricing by product id, then walk
  // the canonical FLAVORS list so the sheet shows exactly the four flavors in
  // brand order — no donation rows, multi-packs, or variety bundles.
  const bySku = new Map<string, ProductLite>();
  for (const product of products as ProductLite[]) {
    if (product.sku) bySku.set(product.sku, product);
  }

  const tiersByProduct = new Map<string, { standard?: number; premium?: number }>();
  for (const row of pricing ?? []) {
    const productId = row.product_id as string;
    const entry = tiersByProduct.get(productId) ?? {};
    const cents = row.price_cents as number;
    if ((row.tier as string) === 'standard') entry.standard = cents;
    if ((row.tier as string) === 'premium') entry.premium = cents;
    tiersByProduct.set(productId, entry);
  }

  const rows: PricingByProduct[] = [];
  for (const flavor of FLAVORS) {
    const product = bySku.get(flavor.sku);
    if (!product) continue;
    const tiers = tiersByProduct.get(product.id) ?? {};
    rows.push({
      productName: flavor.name,
      retailCents: product.price_cents,
      standardCents: tiers.standard,
      premiumCents: tiers.premium,
    });
  }

  return rows;
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

      {/* ============================================================
          PAGE 1 — BRAND SHEET
          The story-and-substance front page that leads the PDF: what
          kiwi pop is, the sensory hook, the experience, the formulation,
          and who it's for. The price sheet follows on page 2.
          ============================================================ */}
      <header className="ls-head">
        <div>
          <div className="ls-brand">KIWI POP</div>
          <div className="ls-sub">Wholesale Brand Sheet · {today}</div>
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
        <h2 className="ls-h2">What it is</h2>
        <p className="ls-body">
          Kiwi Pop is a hard-candy lollipop with a functional payload — sitting
          in the fast-growing intersection of confectionery and functional
          wellness. The indulgence and impulse-buy appeal of candy, with an
          active formulation that delivers a real sensory and physical effect.
          Under 1g sugar, ~35 calories, no crash, no compromise on flavor.
        </p>
      </section>

      <section className="ls-section">
        <h2 className="ls-h2">The hook</h2>
        <div className="ls-hook">
          <div className="ls-hook-name">jambu + chilcuague — the buzz button</div>
          <p>
            An electric mouth-tingle on the first lick, from jambu (<em>acmella
            oleracea</em>), the Brazilian buzz-button flower. Chilcuague
            (<em>heliopsis longipes</em>), the Mexican golden root, carries the
            same active alkamide with a slower, warmer, more numbing profile —
            it keeps the tingle going for the length of the pop rather than
            letting it fade after the first few seconds. Together they&apos;re the
            signature sensory moment customers can&apos;t get anywhere else —
            the reason they pick it up, and the reason they come back. Impossible
            to copy on a shelf full of ordinary candy.
          </p>
          <p className="ls-note">
            US formula only. Neither jambu nor chilcuague is an authorised novel
            food in the EU, so the hook has no route into the European market
            yet — EU buyers should read the Novel Food section of the wholesale
            one-pager before committing to anything.
          </p>
        </div>
      </section>

      <section className="ls-section">
        <h2 className="ls-h2">The experience</h2>
        <p className="ls-note">
          What a single pop actually feels like, start to finish.
        </p>
        <ul className="ls-timeline">
          {TIMELINE.map((moment) => (
            <li key={moment.index}>
              <span className="ls-time">{moment.index}</span>
              <div>
                <strong>{moment.title}</strong>
                <span className="ls-time-body">{moment.body}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="ls-section">
        <h2 className="ls-h2">The formulation</h2>
        <p className="ls-note">
          Clean-label positioning that holds up to scrutiny — lead with the
          no&apos;s.
        </p>
        <div className="ls-claims">
          {FORMULATION_CLAIMS.map((claim) => (
            <div className="ls-claim" key={claim.no}>
              <div className="ls-claim-no">{claim.no}</div>
              <div className="ls-claim-what">{claim.what}</div>
              <p className="ls-claim-why">{claim.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ls-section">
        <h2 className="ls-h2">Who it&apos;s for</h2>
        <p className="ls-body">
          Kiwi Pop is built for the late-night and the neon-lit — candy for
          people who curate their aesthetic as carefully as their supplement
          stack. It lands in boutiques, late-night bars, festival booths, and
          gift shops that want a high-margin impulse buy nobody else carries.
          The brand doesn&apos;t whisper wellness — it glows.
        </p>
      </section>

      {/* ============================================================
          PAGE 2 — PRICE SHEET
          Lineup, payload spec, tiered wholesale pricing, and terms.
          page-break-before puts it on its own sheet in the printed PDF.
          ============================================================ */}
      <div className="ls-page-break" aria-hidden="true" />

      <header className="ls-head ls-head--page2">
        <div>
          <div className="ls-brand">KIWI POP</div>
          <div className="ls-sub">Wholesale Price Sheet · {today}</div>
        </div>
        <div className="ls-contact">
          <div>thekiwipop@gmail.com</div>
          <div>kiwipop.fun/wholesale</div>
        </div>
      </header>

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
.ls-body { font-size: 14.5px; margin: 0; max-width: 660px; }

/* The jambu hook — the one callout that gets a tinted box so it reads as the
   headline feature on the brand sheet. */
.ls-hook {
  border: 1px solid #f2c7dd;
  border-left: 4px solid #ff2d8a;
  background: #fff5fa;
  border-radius: 10px;
  padding: 16px 18px;
}
.ls-hook-name {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #c01f6e;
  margin-bottom: 6px;
}
.ls-hook p { margin: 0; font-size: 14px; }

/* "The experience" timeline — index column + title/body. */
.ls-timeline { list-style: none; margin: 0; padding: 0; }
.ls-timeline li {
  display: flex;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid #efedf3;
}
.ls-timeline li:last-child { border-bottom: none; }
.ls-time {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-weight: 700;
  color: #7b2dff;
  min-width: 52px;
  flex-shrink: 0;
  padding-top: 1px;
}
.ls-timeline strong {
  display: block;
  font-size: 14px;
  text-transform: capitalize;
}
.ls-time-body { font-size: 13px; color: #6b6675; }

/* "The formulation" — the no's, three across. */
.ls-claims {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ls-claim {
  border: 1px solid #e3e0e8;
  border-radius: 10px;
  padding: 14px 16px;
}
.ls-claim-no { font-size: 15px; font-weight: 800; }
.ls-claim-what {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d7a33;
  font-weight: 700;
  margin: 4px 0 8px;
}
.ls-claim-why { font-size: 12.5px; color: #6b6675; margin: 0; }

/* Page break between the brand sheet (page 1) and the price sheet (page 2).
   On screen it's a labeled divider; in print it forces a fresh page. */
.ls-page-break {
  margin: 40px 0;
  border-top: 2px dashed #d6d2dc;
}
.ls-head--page2 { margin-top: 4px; }

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
  .ls-claims { grid-template-columns: 1fr; }
}

@media print {
  @page { size: letter; margin: 0.5in; }
  html, body { background: #fff !important; }
  .ls-doc { padding: 0; max-width: none; }
  .ls-section { break-inside: avoid; }
  .ls-flavor { break-inside: avoid; }
  .ls-claim { break-inside: avoid; }
  .ls-hook { break-inside: avoid; }
  /* Start the price sheet on its own page in the PDF; hide the on-screen
     dashed divider since the page break does the separating. */
  .ls-page-break { break-before: page; margin: 0; border: none; }
}
`;
