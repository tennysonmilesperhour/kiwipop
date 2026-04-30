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
      <div className="page-container" style={{ textAlign: 'center' }}>
        <p
          className="hero-tagline"
          style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
        >
          // your cart
        </p>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textTransform: 'lowercase',
            marginBottom: '1.5rem',
            color: 'var(--lime)',
          }}
        >
          empty.
        </h1>
        <p style={{ color: 'var(--bone)', marginBottom: '2rem' }}>
          go pick a flavor.
        </p>
        <Link href="/" className="btn btn-primary">
          back to the drop
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // your cart
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          marginBottom: '2rem',
        }}
      >
        cart.
      </h1>

      <div className="cart-container">
        <div className="cart-items">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>

        <div className="cart-summary">
          <div className="card-title">order summary</div>

          <div className="summary-row">
            <span>subtotal</span>
            <span>{formatCentsToUSD(total)}</span>
          </div>
          <div className="summary-row">
            <span>shipping</span>
            <span>at checkout</span>
          </div>
          <div className="summary-row summary-total">
            <span>total</span>
            <span>{formatCentsToUSD(total)}</span>
          </div>

          <Link
            href="/checkout"
            className="btn btn-primary btn-full"
            style={{ marginTop: '1rem' }}
          >
            checkout →
          </Link>
          <Link
            href="/"
            className="btn btn-secondary btn-full"
            style={{ marginTop: '0.5rem' }}
          >
            keep shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
