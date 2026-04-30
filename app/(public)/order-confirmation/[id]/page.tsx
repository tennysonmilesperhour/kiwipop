import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatCentsToUSD } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'receipt',
  description: 'your kiwi pop order receipt.',
  robots: { index: false, follow: false },
};

interface OrderItem {
  id: string;
  quantity: number;
  price_cents: number;
  products: { name: string } | null;
}

interface OrderRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  status: string;
  total_cents: number;
  shipping_address: Record<string, string> | null;
  created_at: string;
  items: OrderItem[];
}

interface OrderConfirmationProps {
  params: { id: string };
}

const ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderConfirmation({
  params,
}: OrderConfirmationProps) {
  if (!ID_REGEX.test(params.id)) {
    notFound();
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(
      `
      id, user_id, user_email, status, total_cents,
      shipping_address, created_at,
      items:order_items (
        id, quantity, price_cents,
        products:products ( name )
      )
    `
    )
    .eq('id', params.id)
    .maybeSingle<OrderRow>();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="page-container">
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // receipt
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
          letterSpacing: '-0.04em',
          textTransform: 'lowercase',
          color: 'var(--lime)',
          marginBottom: '0.6rem',
        }}
      >
        your secret is on its way.
      </h1>
      <p style={{ color: 'var(--paper)', marginBottom: '2rem' }}>
        sweet, tart, clean — and en route. receipt to{' '}
        <strong style={{ color: 'var(--lime)' }}>
          {data.user_email || 'your email'}
        </strong>
        .
      </p>

      <div className="card">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <p className="stat-label">order id</p>
            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                wordBreak: 'break-all',
              }}
            >
              {data.id}
            </p>
          </div>
          <div>
            <p className="stat-label">status</p>
            <p style={{ color: 'var(--lime)', fontFamily: 'var(--mono)' }}>
              {data.status}
            </p>
          </div>
          <div>
            <p className="stat-label">total</p>
            <p
              style={{
                color: 'var(--lime)',
                fontFamily: 'var(--display)',
                fontSize: '1.5rem',
                fontWeight: 800,
              }}
            >
              {formatCentsToUSD(data.total_cents)}
            </p>
          </div>
        </div>

        {data.items && data.items.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>product</th>
                <th>qty</th>
                <th>price</th>
                <th>total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.products?.name?.toLowerCase() ?? '—'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCentsToUSD(item.price_cents)}</td>
                  <td>{formatCentsToUSD(item.price_cents * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.shipping_address && (
        <div className="card">
          <div className="card-title">shipping</div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.7 }}>
            {data.shipping_address.firstName} {data.shipping_address.lastName}
            <br />
            {data.shipping_address.address}
            <br />
            {data.shipping_address.city}, {data.shipping_address.state}{' '}
            {data.shipping_address.zip}
            <br />
            {data.shipping_address.country}
          </p>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Link href="/" className="btn btn-primary">
          back to the drop
        </Link>
      </div>
    </div>
  );
}
