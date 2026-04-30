import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'no charge',
  description: 'your kiwi pop checkout was cancelled.',
  robots: { index: false, follow: false },
};

interface CancelledPageProps {
  searchParams: { order_id?: string };
}

export default function CheckoutCancelledPage({
  searchParams,
}: CancelledPageProps) {
  const orderId = searchParams.order_id;

  return (
    <div className="page-container checkout-cancelled">
      <p
        className="hero-tagline"
        style={{ marginBottom: '1rem', color: 'var(--bone)' }}
      >
        // no charge
      </p>
      <h1 style={{ color: 'var(--magenta)' }}>cancelled.</h1>
      <p
        style={{
          marginTop: '1rem',
          color: 'var(--paper)',
          fontFamily: 'var(--mono)',
        }}
      >
        no payment taken. cart is still saved if you want another go.
      </p>
      {orderId ? (
        <p
          style={{
            marginTop: '1.5rem',
            color: 'var(--bone)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          ref · <code>{orderId}</code>
        </p>
      ) : null}
      <div
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Link className="btn btn-primary" href="/cart">
          back to cart
        </Link>
        <Link className="btn" href="/">
          keep shopping
        </Link>
      </div>
    </div>
  );
}
