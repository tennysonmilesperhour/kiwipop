'use client';

import { useCart } from '@/lib/store';
import { CartItem } from '@/components/CartItem';
import { formatCentsToUSD } from '@/lib/format';
import Link from 'next/link';

export default function CartPage() {
  const { items, getTotalPrice } = useCart();
  const total = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
        <p className="text-gray-600 mb-6">Your cart is empty</p>
        <Link href="/" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      <div className="cart-container">
        <div className="cart-items">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>

        <div className="cart-summary">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{formatCentsToUSD(total)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping:</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total:</span>
            <span>{formatCentsToUSD(total)}</span>
          </div>

          <Link href="/checkout" className="btn btn-primary btn-full mt-4">
            Proceed to Checkout
          </Link>

          <Link href="/" className="btn btn-secondary btn-full mt-2">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
