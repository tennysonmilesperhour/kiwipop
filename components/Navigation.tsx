'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/store';

const LINKS: Array<{ href: string; label: string }> = [
  { href: '/#drop', label: 'drop' },
  { href: '/#ingredients', label: 'spec' },
  { href: '/about', label: 'story' },
  { href: '/find-us', label: 'find us' },
  { href: '/raffle', label: 'raffle' },
  { href: '/variety', label: 'variety' },
  { href: '/merch', label: 'merch' },
  { href: '/wholesale', label: 'wholesale' },
  { href: '/#list', label: 'list' },
];

export function Navigation() {
  const { user, signOut, isAdmin } = useAuth();
  const cartCount = useCart((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  // Close the mobile menu whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo" aria-label="kiwi pop home">
        <img
          src="/landing/img/kiwi-kitty-pop.webp"
          alt="kiwi pop"
          className="nav-logo-img"
        />
      </Link>

      <div className={`nav-links${menuOpen ? ' nav-links-open' : ''}`}>
        {LINKS.map((l) => (
          <Link key={l.href} className="nav-link" href={l.href} onClick={() => setMenuOpen(false)}>
            {l.label}
          </Link>
        ))}
        {user ? (
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              signOut();
            }}
            className="nav-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            sign out
          </button>
        ) : (
          <Link className="nav-link" href="/auth/signin" onClick={() => setMenuOpen(false)}>
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
        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'close menu' : 'open menu'}
          aria-expanded={menuOpen}
          aria-controls="nav-links"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`nav-toggle-bars${menuOpen ? ' is-open' : ''}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </nav>
  );
}
