import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { formatCentsToUSD } from '@/lib/format';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const metadata: Metadata = {
  title: 'wholesale · account',
  description: 'your wholesale application status and tier pricing.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface WholesaleAccountRow {
  id: string;
  business_name: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  tier: 'standard' | 'premium';
  created_at: string;
  intake_notes: string | null;
}

interface PricingRow {
  id: string;
  product_id: string;
  tier: 'standard' | 'premium';
  price_cents: number;
  min_quantity: number;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
}

const STATUS_COPY: Record<
  WholesaleAccountRow['approval_status'],
  { headline: string; body: string; color: string }
> = {
  pending: {
    headline: 'in the queue.',
    body: "we batch-review applications. typical turnaround is 2 business days. we'll email the contact email on file with the decision.",
    color: 'var(--sodium)',
  },
  approved: {
    headline: "you're approved.",
    body: "tier pricing is below. to place your first preorder, email wholesale@kiwipop.co with quantities by flavor and we'll send a quote with a payment link.",
    color: 'var(--lime)',
  },
  rejected: {
    headline: 'not this round.',
    body: "we couldn't make it work this cycle. reapply once anything changes — new shop, new channel, new volume — and we'll take a fresh look.",
    color: 'var(--magenta)',
  },
};

export default async function WholesaleAccountPage(): Promise<JSX.Element> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin?next=/wholesale/account');
  }

  const { data: account } = await supabaseAdmin
    .from('wholesale_accounts')
    .select(
      'id, business_name, approval_status, tier, created_at, intake_notes'
    )
    .eq('user_id', user.id)
    .maybeSingle<WholesaleAccountRow>();

  if (!account) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <p
          className="hero-tagline"
          style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
        >
          // wholesale · account
        </p>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            letterSpacing: '-0.03em',
            textTransform: 'lowercase',
            color: 'var(--paper)',
            marginBottom: '1rem',
          }}
        >
          no application yet.
        </h1>
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--bone)',
            marginBottom: '2rem',
          }}
        >
          this email doesn&apos;t have a wholesale application on file. take
          a minute and apply.
        </p>
        <Link href="/wholesale/apply" className="btn btn-primary">
          apply now →
        </Link>
      </div>
    );
  }

  const status = STATUS_COPY[account.approval_status];

  // If approved, fetch tier pricing for the account's tier.
  let pricing: PricingRow[] = [];
  let products: ProductRow[] = [];
  if (account.approval_status === 'approved') {
    const [pricingRes, productsRes] = await Promise.all([
      supabaseAdmin
        .from('wholesale_pricing')
        .select('id, product_id, tier, price_cents, min_quantity')
        .eq('tier', account.tier),
      supabaseAdmin
        .from('products')
        .select('id, name, sku')
        .like('sku', 'KP-%')
        .not('sku', 'like', 'KP-PACK%'),
    ]);
    pricing = (pricingRes.data ?? []) as PricingRow[];
    products = (productsRes.data ?? []) as ProductRow[];
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const sortedPricing = [...pricing].sort((a, b) => {
    const aName = productById.get(a.product_id)?.name ?? '';
    const bName = productById.get(b.product_id)?.name ?? '';
    return aName.localeCompare(bName);
  });

  return (
    <div className="page-container">
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // wholesale · account
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          letterSpacing: '-0.04em',
          textTransform: 'lowercase',
          color: status.color,
          marginBottom: '1rem',
        }}
      >
        {status.headline}
      </h1>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--paper)',
          maxWidth: 720,
          marginBottom: '2.5rem',
        }}
      >
        {status.body}
      </p>

      <div
        className="card"
        style={{ background: 'var(--midnight)', padding: '2rem' }}
      >
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // application on file
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            fontFamily: 'var(--mono)',
            fontSize: 13,
          }}
        >
          <div>
            <div className="stat-label">business</div>
            <div style={{ marginTop: '0.4rem' }}>{account.business_name}</div>
          </div>
          <div>
            <div className="stat-label">status</div>
            <div
              style={{
                marginTop: '0.4rem',
                color: status.color,
                fontWeight: 700,
              }}
            >
              {account.approval_status}
            </div>
          </div>
          <div>
            <div className="stat-label">tier</div>
            <div style={{ marginTop: '0.4rem' }}>{account.tier}</div>
          </div>
          <div>
            <div className="stat-label">applied</div>
            <div style={{ marginTop: '0.4rem' }}>
              {new Date(account.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        {account.intake_notes ? (
          <details style={{ marginTop: '1.5rem' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--bone)',
              }}
            >
              intake details
            </summary>
            <pre
              style={{
                marginTop: '0.75rem',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: 'var(--bone)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {account.intake_notes}
            </pre>
          </details>
        ) : null}
      </div>

      {account.approval_status === 'approved' && sortedPricing.length > 0 && (
        <div className="card" style={{ padding: '2rem' }}>
          <p className="stat-label" style={{ marginBottom: '1rem' }}>
            // your tier · {account.tier}
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>flavor</th>
                <th>per pop</th>
                <th>min order</th>
                <th>case of 50</th>
                <th>case of 200</th>
              </tr>
            </thead>
            <tbody>
              {sortedPricing.map((row) => {
                const product = productById.get(row.product_id);
                if (!product) return null;
                return (
                  <tr key={row.id}>
                    <td className="font-mono">
                      {product.name.toLowerCase()}
                    </td>
                    <td style={{ color: 'var(--lime)' }}>
                      {formatCentsToUSD(row.price_cents)}
                    </td>
                    <td>{row.min_quantity}</td>
                    <td>{formatCentsToUSD(row.price_cents * 50)}</td>
                    <td>{formatCentsToUSD(row.price_cents * 200)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {account.approval_status === 'approved' && (
        <div
          className="card"
          style={{
            padding: '2rem',
            borderColor: 'var(--lime)',
            background: 'var(--midnight)',
          }}
        >
          <p className="stat-label" style={{ marginBottom: '1rem' }}>
            // place a preorder
          </p>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 13,
              lineHeight: 1.7,
              color: 'var(--paper)',
              marginBottom: '1.5rem',
            }}
          >
            email <strong>wholesale@kiwipop.co</strong> with quantities by
            flavor. include your business name + tier — we&apos;ll match it to
            this account, send a quote with a stripe payment link, and lock
            inventory in the next batch.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={`mailto:wholesale@kiwipop.co?subject=Preorder%20%C2%B7%20${encodeURIComponent(account.business_name)}&body=${encodeURIComponent(
                `Hi,\n\nThis is ${account.business_name} (${user.email}). We're approved on the ${account.tier} tier.\n\nQuantities:\n  Kiwi Kitty: __\n  Lemon G. Luci: __\n  Mango Molly: __\n  Mary Mint: __\n\nShipping to:\n  ___\n\nThanks!`
              )}`}
              className="btn btn-primary"
            >
              draft preorder email →
            </a>
            <Link href="/wholesale/apply" className="btn">
              update application
            </Link>
          </div>
        </div>
      )}

      {account.approval_status !== 'approved' && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/wholesale/apply" className="btn btn-primary">
            update application
          </Link>
          <Link href="/wholesale" className="btn">
            back to wholesale
          </Link>
        </div>
      )}
    </div>
  );
}
