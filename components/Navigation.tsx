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
        <Link className="nav-link" href="/#ingredients">
          spec
        </Link>
        <Link className="nav-link" href="/about">
          story
        </Link>
        <Link className="nav-link" href="/find-us">
          find us
        </Link>
        <Link className="nav-link" href="/raffle">
          raffle
        </Link>
        <Link className="nav-link" href="/merch">
          merch
        </Link>
        <Link className="nav-link" href="/wholesale">
          wholesale
        </Link>
        <Link className="nav-link" href="/#list">
          list
        </Link>
        {user ? (
          <button
            type="button"
            onClick={signOut}
            className="nav-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            sign out
          </button>
        ) : (
          <Link className="nav-link" href="/auth/signin">
            sign in
          </Link>
        )}
      </div>
      <div className="nav-actions">
        {isAdmin ? (
          <Link
            href="/admin/dashboard"
            className="nav-cta nav-cta-admin"
            aria-label="open admin dashboard"
          >
            <span aria-hidden="true">▸</span>&nbsp;admin
          </Link>
        ) : null}
        <Link href="/cart" className="nav-cta" aria-label="cart">
          cart
          {mounted && cartCount > 0 ? (
            <span className="cart-badge">{cartCount}</span>
          ) : null}
        </Link>
      </div>
    </nav>
  );
}
