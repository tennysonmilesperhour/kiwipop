'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/store';

export function Navigation() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          🍭 Kiwi Pop
        </Link>
        <div className="navbar-menu">
          <Link href="/" className="nav-link">
            Shop
          </Link>
          {!user ? (
            <>
              <Link href="/auth/signin" className="nav-link">
                Sign In
              </Link>
              <Link href="/auth/signup" className="nav-link">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <Link href="/admin/dashboard" className="nav-link admin-link">
                  Admin
                </Link>
              )}
              <Link href="/cart" className="nav-link cart-link">
                Cart ({cartCount})
              </Link>
              <button onClick={signOut} className="nav-link logout-button">
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
