'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV: Array<{ href: string; label: string }> = [
  { href: '/admin/dashboard', label: 'dashboard' },
  { href: '/admin/orders', label: 'orders' },
  { href: '/admin/inventory', label: 'inventory' },
  { href: '/admin/products', label: 'products' },
  { href: '/admin/wholesale', label: 'wholesale' },
  { href: '/admin/manufacturing', label: 'manufacturing' },
  { href: '/admin/financials', label: 'financials' },
  { href: '/admin/logistics', label: 'logistics' },
  { href: '/admin/sheets', label: 'sheets' },
  { href: '/admin/raffle', label: 'raffle' },
  { href: '/admin/cash-donations', label: 'cash donations' },
  { href: '/admin/pitch', label: 'pitch deck' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="page-container">
        <p
          style={{
            color: 'var(--bone)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          loading…
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>// admin</h2>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item"
                style={
                  active
                    ? {
                        background: 'var(--midnight)',
                        color: 'var(--lime)',
                        borderLeft: '2px solid var(--lime)',
                      }
                    : undefined
                }
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
