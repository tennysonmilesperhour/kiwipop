'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartItem } from '@/lib/store';

/**
 * Landing page for the "back to my cart" link in the checkout recovery
 * email. Rebuilds the cart from the abandoned order, then sends the
 * customer to /cart to review it before paying.
 */
export function RecoverCart({ token }: { token: string }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/recover?t=${encodeURIComponent(token)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('not found');
        const json = (await res.json()) as { items: CartItem[] };
        if (cancelled) return;
        if (json.items.length === 0) throw new Error('empty');
        const { clearCart, addItem } = useCart.getState();
        clearCart();
        for (const item of json.items) addItem(item);
        router.replace('/cart');
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="page-container checkout-cancelled">
      <p
        className="hero-tagline"
        style={{ marginBottom: '1rem', color: 'var(--bone)' }}
      >
        // your cart
      </p>
      {failed ? (
        <>
          <h1 style={{ color: 'var(--magenta)' }}>link expired.</h1>
          <p
            style={{
              marginTop: '1rem',
              color: 'var(--paper)',
              fontFamily: 'var(--mono)',
            }}
          >
            we couldn&apos;t rebuild that cart, or what was in it isn&apos;t for
            sale anymore. the shop is one tap away.
          </p>
          <div style={{ marginTop: '2.5rem' }}>
            <Link className="btn btn-primary" href="/">
              go to the shop
            </Link>
          </div>
        </>
      ) : (
        <h1 style={{ color: 'var(--lime)' }}>putting your pops back…</h1>
      )}
    </div>
  );
}
