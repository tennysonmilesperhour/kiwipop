'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/store';

export function Navigation() {
  const { user, signOut, isAdmin } = useAuth();
  const cartCount = useCart((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo" aria-label="kiwi pop home">
        kiwi pop
      </Link>
      <div className="nav-links">
        <Link className="nav-link" href="/#drop">
          drop
        </Link>
        <Link className="nav-link" href="/#crew">
          crew
        </Link>
        <Link className="nav-link" href="/#spec">
          spec
        </Link>
        <Link className="nav-link" href="/#list">
          list
        </Link>
        {user ? (
          <>
            {isAdmin && (
              <Link className="nav-link" href="/admin/dashboard">
                admin
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              sign out
            </button>
          </>
        ) : (
          <Link className="nav-link" href="/auth/signin">
            sign in
          </Link>
        )}
      </div>
      <Link href="/cart" className="nav-cta" aria-label="cart">
        cart{mounted && cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
      </Link>
    </nav>
  );
}
