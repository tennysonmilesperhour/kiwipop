'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV: Array<{ href: string; label: string }> = [
  { href: '/admin/dashboard', label: 'dashboard' },
  { href: '/admin/orders', label: 'orders' },
  { href: '/admin/inventory', label: 'inventory' },
  { href: '/admin/ingredients', label: 'ingredients' },
  { href: '/admin/products', label: 'products' },
  { href: '/admin/wholesale', label: 'wholesale' },
  { href: '/admin/manufacturing', label: 'manufacturing' },
  { href: '/admin/financials', label: 'financials' },
  { href: '/admin/logistics', label: 'logistics' },
  { href: '/admin/map', label: 'map · live' },
  { href: '/admin/sheets', label: 'sheets' },
  { href: '/admin/raffle', label: 'raffle' },
  { href: '/admin/reviews', label: 'reviews' },
  { href: '/admin/cash-donations', label: 'cash donations' },
  { href: '/admin/list', label: 'marketing list' },
  { href: '/admin/pitch', label: 'pitch deck' },
  { href: '/admin/campaign', label: 'campaign updates' },
  { href: '/admin/team', label: 'admin team' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  // Collapse the mobile nav after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  const activeLabel = NAV.find((i) => i.href === pathname)?.label ?? 'menu';

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--bone)' }}>loading…</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>// admin</h2>
          <button
            type="button"
            className="admin-nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="admin-nav-toggle-label">{activeLabel}</span>
            <span className={`nav-toggle-bars${menuOpen ? ' is-open' : ''}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
        <nav
          id="admin-sidebar-nav"
          className={`sidebar-nav${menuOpen ? ' sidebar-nav-open' : ''}`}
        >
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? ' nav-item-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
