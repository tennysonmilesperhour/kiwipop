import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "you're in",
  description: 'your kiwi pop order was received.',
  robots: { index: false, follow: false },
};

interface SuccessPageProps {
  searchParams: { order_id?: string; session_id?: string };
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const orderId = searchParams.order_id;

  return (
    <div className="page-container checkout-success">
      <p
        className="hero-tagline"
        style={{ marginBottom: '1rem', color: 'var(--bone)' }}
      >
        // confirmed
      </p>
      <h1>you&apos;re in.</h1>
      <p
        style={{
          marginTop: '1rem',
          color: 'var(--paper)',
          fontFamily: 'var(--mono)',
        }}
      >
        we got the order. packing now. tracking link in your inbox.
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
        {orderId ? (
          <Link className="btn btn-primary" href={`/order-confirmation/${orderId}`}>
            view receipt
          </Link>
        ) : null}
        <Link className="btn" href="/">
          back to the drop
        </Link>
      </div>
    </div>
  );
}
