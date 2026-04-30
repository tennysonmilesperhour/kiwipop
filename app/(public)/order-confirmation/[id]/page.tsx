import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatCentsToUSD } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order confirmed',
  description: 'Your Kiwi Pop order receipt.',
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
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed</h1>
        <p className="text-gray-600 mb-6">
          Thanks for your order. We&apos;ve sent a receipt to{' '}
          <strong>{data.user_email || 'your email on file'}</strong>.
        </p>

        <div className="bg-light p-4 rounded-lg mb-6 text-left">
          <p className="mb-2">
            <strong>Order ID:</strong>{' '}
            <span className="font-mono text-sm">{data.id}</span>
          </p>
          <p className="mb-2">
            <strong>Status:</strong> {data.status}
          </p>
          <p>
            <strong>Total:</strong> {formatCentsToUSD(data.total_cents)}
          </p>
        </div>

        {data.items && data.items.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-left">Order Items</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.products?.name ?? 'Unknown product'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCentsToUSD(item.price_cents)}</td>
                    <td>{formatCentsToUSD(item.price_cents * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.shipping_address && (
          <div className="text-left text-sm mb-6">
            <h3 className="font-bold mb-1">Shipping to</h3>
            <p>
              {data.shipping_address.firstName} {data.shipping_address.lastName}
            </p>
            <p>{data.shipping_address.address}</p>
            <p>
              {data.shipping_address.city}, {data.shipping_address.state}{' '}
              {data.shipping_address.zip}
            </p>
            <p>{data.shipping_address.country}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
