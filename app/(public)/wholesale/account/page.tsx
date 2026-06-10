import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { formatCentsToUSD } from '@/lib/format';
import { FLAVORS_BY_SKU } from '@/lib/flavors';
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
  sku: string;
}

const STATUS_COPY: Record<
  WholesaleAccountRow['approval_status'],
  { headline: React.ReactNode; body: string; color: string; accent: string }
> = {
  pending: {
    headline: (
      <>
        in the <span className="ws-accent">queue</span>.
      </>
    ),
    body: "we batch-review applications. typical turnaround is 2 business days. we'll email the contact email on file with the decision.",
    color: 'var(--sodium)',
    accent: 'ws-card--sodium',
  },
  approved: {
    headline: (
      <>
        you&apos;re <span className="ws-accent">approved</span>.
      </>
    ),
    body: "tier pricing is below — and the full line sheet is one click away. to place your first preorder, email thekiwipop@gmail.com with quantities by flavor and we'll send a quote with a payment link.",
    color: 'var(--lime)',
    accent: 'ws-card--lime',
  },
  rejected: {
    headline: (
      <>
        not this <span className="ws-accent">round</span>.
      </>
    ),
    body: "we couldn't make it work this cycle. reapply once anything changes (new shop, new channel, new volume) and we'll take a fresh look.",
    color: 'var(--magenta)',
    accent: 'ws-card--accent',
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
      <div className="page-container wholesale-suite" style={{ maxWidth: 600 }}>
        <p className="ws-eyebrow">wholesale · account</p>
        <h1 className="ws-h1">
          no application <span className="ws-accent">yet</span>.
        </h1>
        <p className="ws-lede">
          this email doesn&apos;t have a wholesale application on file. take a
          minute and apply.
        </p>
        <Link href="/wholesale/apply" className="btn btn-primary">
          apply now →
        </Link>
      </div>
    );
  }

  const status = STATUS_COPY[account.approval_status];
  const isApproved = account.approval_status === 'approved';

  // If approved, fetch tier pricing for the account's tier.
  let pricing: PricingRow[] = [];
  let products: ProductRow[] = [];
  if (isApproved) {
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
  const flavorName = (p: ProductRow | undefined): string =>
    p ? FLAVORS_BY_SKU[p.sku]?.name ?? p.name.toLowerCase() : '';
  const sortedPricing = [...pricing].sort((a, b) =>
    flavorName(productById.get(a.product_id)).localeCompare(
      flavorName(productById.get(b.product_id))
    )
  );

  return (
    <div className="page-container wholesale-suite">
      <p className="ws-eyebrow" style={{ color: status.color }}>
        wholesale · account
      </p>
      <h1 className="ws-h1">{status.headline}</h1>
      <p className="ws-lede">{status.body}</p>

      <div className={`ws-card ${status.accent}`}>
        <p className="ws-section-label">// application on file</p>
        <div className="ws-stat-grid">
          <div>
            <div className="ws-stat-label">business</div>
            <div className="ws-stat-value">{account.business_name}</div>
          </div>
          <div>
            <div className="ws-stat-label">status</div>
            <div
              className="ws-stat-value"
              style={{ color: status.color, fontWeight: 700 }}
            >
              {account.approval_status}
            </div>
          </div>
          <div>
            <div className="ws-stat-label">tier</div>
            <div className="ws-stat-value">
              <span className={`ws-badge ws-badge--${account.tier}`}>
                {account.tier}
              </span>
            </div>
          </div>
          <div>
            <div className="ws-stat-label">applied</div>
            <div className="ws-stat-value">
              {new Date(account.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        {account.intake_notes ? (
          <details style={{ marginTop: '1.5rem' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: 'var(--bone)',
              }}
            >
              intake details
            </summary>
            <pre
              style={{
                marginTop: '0.75rem',
                fontFamily: 'var(--ws-body, inherit)',
                fontSize: 13,
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

      {isApproved && sortedPricing.length > 0 && (
        <div className="ws-card ws-card--cyan">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1.1rem',
            }}
          >
            <p
              className="ws-section-label"
              style={{ color: 'var(--cyan)', margin: 0 }}
            >
              // your tier · {account.tier}
            </p>
            <Link
              href="/wholesale/line-sheet"
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: 13 }}
            >
              full line sheet →
            </Link>
          </div>
          <div className="ws-table-scroll">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>flavor</th>
                  <th>per pop</th>
                  <th>min order</th>
                  <th>case of {sortedPricing[0]?.min_quantity ?? 50}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPricing.map((row) => {
                  const product = productById.get(row.product_id);
                  if (!product) return null;
                  return (
                    <tr key={row.id}>
                      <td className="ws-flavor">{flavorName(product)}</td>
                      <td
                        className={`ws-num ${account.tier === 'premium' ? 'ws-prem' : 'ws-std'}`}
                      >
                        {formatCentsToUSD(row.price_cents)}
                      </td>
                      <td className="ws-num">{row.min_quantity}</td>
                      <td className="ws-case ws-num">
                        {formatCentsToUSD(row.price_cents * row.min_quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="ws-card ws-card--accent">
          <p className="ws-section-label">// place a preorder</p>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--paper)',
              marginBottom: '1.5rem',
            }}
          >
            email <strong>thekiwipop@gmail.com</strong> with quantities by
            flavor. include your business name + tier, we&apos;ll match it to
            this account, send a quote with a stripe payment link, and lock
            inventory in the next batch.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={`mailto:thekiwipop@gmail.com?subject=Preorder%20%C2%B7%20${encodeURIComponent(account.business_name)}&body=${encodeURIComponent(
                `Hi,\n\nThis is ${account.business_name} (${user.email}). We're approved on the ${account.tier} tier.\n\nQuantities:\n  Kiwi Pop: __\n  Luci Ginger Lemon: __\n  Molly Matcha Mint: __\n  Mary Caramel Apple Cinn: __\n\nShipping to:\n  ___\n\nThanks!`
              )}`}
              className="btn btn-primary"
            >
              draft preorder email →
            </a>
            <Link href="/wholesale/line-sheet" className="btn btn-secondary">
              view line sheet
            </Link>
          </div>
        </div>
      )}

      {!isApproved && (
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/wholesale/apply" className="btn btn-primary">
            update application
          </Link>
          <Link href="/wholesale" className="btn btn-secondary">
            back to wholesale
          </Link>
        </div>
      )}
    </div>
  );
}
