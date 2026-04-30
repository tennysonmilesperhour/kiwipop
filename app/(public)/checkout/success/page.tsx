import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  description: 'Your Kiwi Pop order has been received.',
  robots: { index: false, follow: false },
};

interface SuccessPageProps {
  searchParams: { order_id?: string; session_id?: string };
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const orderId = searchParams.order_id;

  return (
    <div className="checkout-success">
      <h1 className="text-3xl font-bold mb-4">Thanks for your order</h1>
      <p className="mb-2">
        Your payment was received. We&apos;re packing your pops now and will email
        a tracking link once your order ships.
      </p>
      {orderId ? (
        <p className="text-sm text-zinc-600 mb-6">
          Order reference: <code>{orderId}</code>
        </p>
      ) : null}
      <div className="flex gap-3">
        {orderId ? (
          <Link className="btn btn-primary" href={`/order-confirmation/${orderId}`}>
            View order
          </Link>
        ) : null}
        <Link className="btn" href="/">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
