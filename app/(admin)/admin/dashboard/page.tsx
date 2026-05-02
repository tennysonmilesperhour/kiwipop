'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { useOrders, useProducts } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/format';

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  user_email: string | null;
  created_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  price_cents: number;
  in_stock: number;
  preorder_only: boolean;
}

interface ToolCard {
  href: string;
  label: string;
  description: string;
  accent: string;
}

const TOOLS: ToolCard[] = [
  {
    href: '/admin/orders',
    label: 'orders',
    description:
      'review · fulfill · refund · update status. stripe refunds fire here when you mark paid → cancelled.',
    accent: 'var(--lime)',
  },
  {
    href: '/admin/products',
    label: 'products',
    description:
      'create · edit · delete pops. upload product imagery direct to supabase storage.',
    accent: 'var(--magenta)',
  },
  {
    href: '/admin/inventory',
    label: 'inventory',
    description:
      'adjust stock per flavor. keeps products.in_stock and inventory table synced.',
    accent: 'var(--cyan)',
  },
  {
    href: '/admin/wholesale',
    label: 'wholesale',
    description:
      'approve / reject business accounts · set tier · manage tiered pricing.',
    accent: 'var(--ultraviolet)',
  },
  {
    href: '/admin/wholesale/inquiries',
    label: 'wholesale inquiries',
    description:
      'public contact-form intake. every /wholesale/contact submission lands here with email-forward status, status workflow, and one-click reply.',
    accent: 'var(--cherry)',
  },
  {
    href: '/admin/manufacturing',
    label: 'manufacturing',
    description:
      'create batches · raw materials · suppliers · BOM. status flips auto-stamp delivery.',
    accent: 'var(--sodium)',
  },
  {
    href: '/admin/financials',
    label: 'financials',
    description:
      'P&L summary · revenue, COGS, expenses, gross margin. expense create/delete.',
    accent: 'var(--lime)',
  },
  {
    href: '/admin/logistics',
    label: 'logistics',
    description:
      'shipments · tracking numbers · returns + Stripe refunds via the RMA flow.',
    accent: 'var(--magenta)',
  },
  {
    href: '/admin/sheets',
    label: 'sheets',
    description:
      'link Google Sheets to financials / manufacturing / inventory / wholesale and they render inline on those pages.',
    accent: 'var(--ultraviolet)',
  },
  {
    href: '/admin/pitch',
    label: 'pitch deck',
    description:
      'investor pitch · $5K and $50K plans with budget, milestones, projections.',
    accent: 'var(--cyan)',
  },
];

export default function AdminDashboard() {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (orders && products) {
      const totalRevenue = (orders as OrderRow[]).reduce(
        (sum, order) => sum + (order.total_cents || 0),
        0
      );
      const paidRevenue = (orders as OrderRow[])
        .filter((o) => o.status === 'paid' || o.status === 'completed' || o.status === 'shipped')
        .reduce((sum, o) => sum + (o.total_cents || 0), 0);
      const pendingOrders = (orders as OrderRow[]).filter(
        (order) => order.status === 'pending'
      ).length;

      setStats({
        totalRevenue,
        paidRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        pendingOrders,
      });
    }
  }, [orders, products]);

  return (
    <AdminLayout>
      <div className="admin-home">
        <header className="admin-home-header">
          <p className="stat-label">// admin · home</p>
          <h1>kiwi pop · ops.</h1>
          <p className="admin-home-meta">
            every tool below is a click away. the sidebar on the left does the
            same thing — pick whichever feels faster.
          </p>
        </header>

        <div className="dashboard-grid">
          <div className="stat-card">
            <p className="stat-label">paid revenue</p>
            <p className="stat-value">{formatCentsToUSD(stats.paidRevenue)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">orders (all)</p>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">products live</p>
            <p className="stat-value">{stats.totalProducts}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">pending orders</p>
            <p className="stat-value">{stats.pendingOrders}</p>
          </div>
        </div>

        <section className="admin-tools">
          <h2 className="card-title">tools</h2>
          <div className="admin-tool-grid">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="admin-tool-card"
                style={{ '--c': tool.accent } as React.CSSProperties}
              >
                <span className="admin-tool-label">{tool.label}</span>
                <span className="admin-tool-arrow" aria-hidden="true">
                  ▸
                </span>
                <span className="admin-tool-description">
                  {tool.description}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 admin-home-tables">
          <div className="card">
            <h2 className="card-title">recent orders</h2>
            {ordersLoading ? (
              <p>loading…</p>
            ) : orders && orders.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>id</th>
                    <th>status</th>
                    <th>total</th>
                    <th>date</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders as OrderRow[]).slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="font-mono text-sm">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td>
                        <span
                          className="px-2 py-1 text-xs font-bold rounded"
                          style={{ background: 'rgba(168,255,60,0.1)' }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>{formatCentsToUSD(order.total_cents)}</td>
                      <td className="text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>no orders yet · check back after your first drop.</p>
            )}
            <Link
              href="/admin/orders"
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              view all orders →
            </Link>
          </div>

          <div className="card">
            <h2 className="card-title">products</h2>
            {productsLoading ? (
              <p>loading…</p>
            ) : products && products.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>name</th>
                    <th>price</th>
                    <th>stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(products as ProductRow[]).slice(0, 5).map((product) => (
                    <tr key={product.id}>
                      <td>{product.name?.toLowerCase()}</td>
                      <td>{formatCentsToUSD(product.price_cents)}</td>
                      <td>{product.in_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>
                no products yet. run migration 004 in supabase to seed kiwi
                kitty + the three preorder flavors.
              </p>
            )}
            <Link
              href="/admin/products"
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              manage products →
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
