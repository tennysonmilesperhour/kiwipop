'use client';

import { useOrderWithItems } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/stripe';
import Link from 'next/link';

interface OrderConfirmationProps {
  params: {
    id: string;
  };
}

export default function OrderConfirmation({ params }: OrderConfirmationProps) {
  const { data: order, isLoading, error } = useOrderWithItems(params.id);

  if (isLoading) return <p>Loading order...</p>;
  if (error) return <p className="alert alert-error">Error loading order</p>;
  if (!order) return <p>Order not found</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your order. Your confirmation has been sent to{' '}
          <strong>{order.user_email || 'your email'}</strong>
        </p>

        <div className="bg-light p-4 rounded-lg mb-6 text-left">
          <p className="mb-2">
            <strong>Order ID:</strong> {order.id}
          </p>
          <p className="mb-2">
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Total:</strong> {formatCentsToUSD(order.total_cents)}
          </p>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-left">Order Items</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.products?.name || 'Unknown'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCentsToUSD(item.price_cents)}</td>
                    <td>
                      {formatCentsToUSD(item.price_cents * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn btn-primary">
            Continue Shopping
          </Link>
          <Link href="/orders" className="btn btn-secondary">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
