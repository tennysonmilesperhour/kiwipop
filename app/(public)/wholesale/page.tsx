import Link from 'next/link';
import type { Metadata } from 'next';
import { formatCentsToUSD } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const metadata: Metadata = {
  title: 'wholesale · refreshing club lolli',
  description:
    'kiwi pop on your shelf. tiered pricing, low MOQ, festival-ready. apply and we email you back.',
};

export const dynamic = 'force-dynamic';

interface PricingRow {
  product_id: string;
  tier: 'standard' | 'premium';
  price_cents: number;
  min_quantity: number;
  product_name: string | null;
}

interface ProductLite {
  id: string;
  name: string;
  sku: string | null;
  price_cents: number;
}

interface PricingByProduct {
  productName: string;
  retailCents: number;
  standard?: PricingRow;
  premium?: PricingRow;
}

async function loadPricing(): Promise<PricingByProduct[]> {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, sku, price_cents')
    .order('name');

  const { data: pricing } = await supabaseAdmin
    .from('wholesale_pricing')
    .select('product_id, tier, price_cents, min_quantity');

  if (!products || !pricing) return [];

  const byProductId = new Map<string, PricingByProduct>();
  for (const product of products as ProductLite[]) {
    if (!product.sku?.startsWith('KP-')) continue;
    if (product.sku.startsWith('KP-PACK')) continue;
    byProductId.set(product.id, {
      productName: product.name,
      retailCents: product.price_cents,
    });
  }

  for (const row of pricing) {
    const entry = byProductId.get(row.product_id as string);
    if (!entry) continue;
    const tier = row.tier as 'standard' | 'premium';
    const augmented = {
      product_id: row.product_id as string,
      tier,
      price_cents: row.price_cents as number,
      min_quantity: row.min_quantity as number,
      product_name: entry.productName,
    };
    entry[tier] = augmented;
  }

  return Array.from(byProductId.values());
}

export default async function WholesaleLandingPage(): Promise<JSX.Element> {
  const pricing = await loadPricing();

  return (
    <div className="page-container">
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // wholesale
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          letterSpacing: '-0.04em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '1rem',
        }}
      >
        kiwi pop on your shelf.
      </h1>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--bone)',
          maxWidth: 760,
          marginBottom: '2.5rem',
        }}
      >
        boutiques, late-night bars, festival vendors, gift shops. apply with
        your business details and we get back fast. tiered pricing scales
        with your order size — no minimums for the first conversation.
      </p>

      <div
        className="card"
        style={{
          padding: '2rem',
          background: 'var(--midnight)',
          borderColor: 'var(--lime)',
        }}
      >
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // tiered pricing · per pop
        </p>
        {pricing.length === 0 ? (
          <p style={{ color: 'var(--bone)', fontFamily: 'var(--mono)' }}>
            tier pricing seeds when you run migration 006 in supabase. once
            it&apos;s in, this table populates from{' '}
            <code>wholesale_pricing</code>.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>flavor</th>
                <th>retail</th>
                <th>standard · 50+</th>
                <th>premium · 200+</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((row) => (
                <tr key={row.productName}>
                  <td className="font-mono">
                    {row.productName.toLowerCase()}
                  </td>
                  <td>{formatCentsToUSD(row.retailCents)}</td>
                  <td style={{ color: 'var(--lime)' }}>
                    {row.standard
                      ? formatCentsToUSD(row.standard.price_cents)
                      : 'tbd'}
                  </td>
                  <td style={{ color: 'var(--cyan)' }}>
                    {row.premium
                      ? formatCentsToUSD(row.premium.price_cents)
                      : 'tbd'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.05em',
            color: 'var(--bone)',
            opacity: 0.85,
          }}
        >
          // standard tier opens at 50 units · premium at 200 units. mix and
          match flavors against the same tier.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // how it works
        </p>
        <ol className="wholesale-steps">
          <li>
            <span className="wholesale-step-num">01</span>
            <div>
              <strong>apply</strong> — business name, contact, channel, expected
              volume. takes 90 seconds.
            </div>
          </li>
          <li>
            <span className="wholesale-step-num">02</span>
            <div>
              <strong>review</strong> — we batch-review applications. typical
              turnaround is 2 business days. expect an email either way.
            </div>
          </li>
          <li>
            <span className="wholesale-step-num">03</span>
            <div>
              <strong>place a preorder</strong> — once approved you can
              preorder full cases at tier pricing. we lock the batch and ship
              when the run is ready.
            </div>
          </li>
          <li>
            <span className="wholesale-step-num">04</span>
            <div>
              <strong>ongoing</strong> — reorder via{' '}
              <code>wholesale@kiwipop.co</code>. festival drops get a heads-up
              before public.
            </div>
          </li>
        </ol>
      </div>

      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/wholesale/apply" className="btn btn-primary">
          apply now →
        </Link>
        <Link href="/wholesale/account" className="btn">
          check application status
        </Link>
        <a className="btn btn-secondary" href="mailto:wholesale@kiwipop.co">
          questions · email us
        </a>
      </div>
    </div>
  );
}
