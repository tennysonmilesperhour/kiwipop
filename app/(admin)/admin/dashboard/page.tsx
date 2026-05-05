'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { useOrders, useProducts } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';

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

interface FinancialsSummary {
  stripe: {
    grossCents: number;
    refundedCents: number;
    netCents: number;
    chargeCount: number;
  };
  reconcile: {
    marked_paid: number;
    marked_cancelled: number;
  };
  derived: {
    revenueCents: number;
    netIncomeCents: number;
  };
  generatedAt: string;
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
  {
    href: '/admin/cash-donations',
    label: 'cash donations',
    description:
      'log cash / check / off-rail venmo received in person. adds to the homepage fundraiser progress bar alongside paid stripe orders.',
    accent: 'var(--lime)',
  },
  {
    href: '/admin/list',
    label: 'marketing list',
    description:
      'every email captured · opt-in flag · order history · CSV export for klaviyo / mailchimp / resend.',
    accent: 'var(--cyan)',
  },
];

export default function AdminDashboard() {
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const queryClient = useQueryClient();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [financials, setFinancials] = useState<FinancialsSummary | null>(null);

  // Auto-reconcile + pull live Stripe totals on every dashboard mount. This
  // self-heals any orders the webhook missed and keeps the revenue cards
  // accurate without admins having to remember to hit the orders page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/admin/financials/summary', {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const json = (await response.json()) as FinancialsSummary;
        if (cancelled) return;
        setFinancials(json);
        // If reconcile flipped any orders, the local orders cache is stale.
        if (
          json.reconcile.marked_paid > 0 ||
          json.reconcile.marked_cancelled > 0
        ) {
          await queryClient.invalidateQueries({ queryKey: ['orders'] });
          await refetchOrders();
        }
      } catch {
        // Soft-fail: dashboard still works off DB-only numbers below.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryClient, refetchOrders]);

  useEffect(() => {
    if (orders && products) {
      const totalRevenue = (orders as OrderRow[]).reduce(
        (sum, order) => sum + (order.total_cents || 0),
        0
      );
      const paidRevenue = (orders as OrderRow[])
        .filter((o) => o.status === 'paid' || o.status === 'completed' || o.status === 'shipped')
        .reduce((sum, o) => sum + (o.total_cents || 0), 0);
      const pendingRows = (orders as OrderRow[]).filter(
        (order) => order.status === 'pending'
      );
      const pendingRevenue = pendingRows.reduce(
        (sum, o) => sum + (o.total_cents || 0),
        0,
      );

      setStats({
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        pendingOrders: pendingRows.length,
      });
    }
  }, [orders, products]);

  // Stripe is the source of truth for "money actually collected" — fall back
  // to the DB-derived number only if the Stripe call failed.
  const paidRevenueDisplay =
    financials !== null ? financials.stripe.netCents : stats.paidRevenue;

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
            <p className="stat-label">
              paid revenue {financials ? '· stripe' : ''}
            </p>
            <p className="stat-value">{formatCentsToUSD(paidRevenueDisplay)}</p>
            {financials && financials.stripe.refundedCents > 0 ? (
              <p className="stat-label" style={{ marginTop: '0.25rem' }}>
                gross {formatCentsToUSD(financials.stripe.grossCents)} − refunds{' '}
                {formatCentsToUSD(financials.stripe.refundedCents)}
              </p>
            ) : null}
          </div>
          <div className="stat-card">
            <p className="stat-label">pending revenue</p>
            <p className="stat-value">{formatCentsToUSD(stats.pendingRevenue)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">orders (all)</p>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">pending orders</p>
            <p className="stat-value">{stats.pendingOrders}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">products live</p>
            <p className="stat-value">{stats.totalProducts}</p>
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
