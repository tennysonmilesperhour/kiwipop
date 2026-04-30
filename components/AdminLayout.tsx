'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <Link href="/admin/dashboard" className="nav-item">
            Dashboard
          </Link>
          <Link href="/admin/orders" className="nav-item">
            Orders
          </Link>
          <Link href="/admin/inventory" className="nav-item">
            Inventory
          </Link>
          <Link href="/admin/products" className="nav-item">
            Products
          </Link>
          <Link href="/admin/wholesale" className="nav-item">
            Wholesale
          </Link>
          <Link href="/admin/manufacturing" className="nav-item">
            Manufacturing
          </Link>
          <Link href="/admin/financials" className="nav-item">
            Financials
          </Link>
          <Link href="/admin/logistics" className="nav-item">
            Logistics
          </Link>
        </nav>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
