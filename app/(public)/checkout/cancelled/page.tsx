import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout cancelled',
  description: 'Your Kiwi Pop checkout was cancelled.',
  robots: { index: false, follow: false },
};

interface CancelledPageProps {
  searchParams: { order_id?: string };
}

export default function CheckoutCancelledPage({ searchParams }: CancelledPageProps) {
  const orderId = searchParams.order_id;

  return (
    <div className="checkout-cancelled">
      <h1 className="text-3xl font-bold mb-4">Checkout cancelled</h1>
      <p className="mb-6">
        No payment was taken. Your cart is still saved if you want to try again.
      </p>
      {orderId ? (
        <p className="text-sm text-zinc-600 mb-6">
          Reference: <code>{orderId}</code>
        </p>
      ) : null}
      <div className="flex gap-3">
        <Link className="btn btn-primary" href="/cart">
          Back to cart
        </Link>
        <Link className="btn" href="/">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
