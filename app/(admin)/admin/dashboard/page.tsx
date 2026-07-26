'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { PlanBanner } from '@/components/admin/PlanBanner';
import { supabase } from '@/lib/supabase';
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
    refundedChargeCount: number;
  };
  reconcile: {
    marked_paid: number;
    marked_cancelled: number;
  };
  db: {
    paidOrderCents: number;
    paidOrderCount: number;
    pendingOrderCents: number;
    pendingOrderCount: number;
    cogsCents: number;
    expensesCents: number;
    cashDonationCents: number;
  };
  derived: {
    revenueCents: number;
    cogsCents: number;
    expensesCents: number;
    grossProfitCents: number;
    netIncomeCents: number;
  };
  generatedAt: string;
}

interface ListTotals {
  total: number;
  opted_in: number;
  buyers: number;
  buyers_opted_in: number;
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
  // Approved wholesale accounts — the plan's headline operating metric, so the
  // dashboard reads it directly rather than making the user open /admin/wholesale.
  const [approvedDoors, setApprovedDoors] = useState<number | null>(null);
  const [listTotals, setListTotals] = useState<ListTotals | null>(null);

  // Auto-reconcile + pull live Stripe totals on every dashboard mount. This
  // self-heals any orders the webhook missed and keeps the revenue cards
  // accurate without admins having to remember to hit the orders page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [summaryResp, listResp] = await Promise.allSettled([
        fetch('/api/admin/financials/summary', { cache: 'no-store' }),
        fetch('/api/admin/list', { cache: 'no-store' }),
      ]);
      if (cancelled) return;

      if (summaryResp.status === 'fulfilled' && summaryResp.value.ok) {
        const json = (await summaryResp.value.json()) as FinancialsSummary;
        if (cancelled) return;
        setFinancials(json);
        if (
          json.reconcile.marked_paid > 0 ||
          json.reconcile.marked_cancelled > 0
        ) {
          await queryClient.invalidateQueries({ queryKey: ['orders'] });
          await refetchOrders();
        }
      }

      if (listResp.status === 'fulfilled' && listResp.value.ok) {
        const json = (await listResp.value.json()) as { totals: ListTotals };
        if (cancelled) return;
        setListTotals(json.totals);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryClient, refetchOrders]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { count } = await supabase
        .from('wholesale_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'approved');
      if (!cancelled) setApprovedDoors(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
  const netProfitCents = financials?.derived.netIncomeCents ?? 0;
  const cashDonationCents = financials?.db.cashDonationCents ?? 0;

  // Recency buckets — split paid orders into today / 7d / 30d so admins
  // can read momentum at a glance without bouncing to the financials page.
  const PAID_STATUSES = new Set(['paid', 'shipped', 'completed']);
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const orderRows = (orders ?? []) as OrderRow[];
  const paidOrders = orderRows.filter((o) => PAID_STATUSES.has(o.status));
  const sumIn = (windowMs: number) =>
    paidOrders
      .filter((o) => Date.parse(o.created_at) >= now - windowMs)
      .reduce((s, o) => s + (o.total_cents || 0), 0);
  const countIn = (windowMs: number) =>
    paidOrders.filter((o) => Date.parse(o.created_at) >= now - windowMs).length;

  const todayCents = paidOrders
    .filter((o) => Date.parse(o.created_at) >= todayStartMs)
    .reduce((s, o) => s + (o.total_cents || 0), 0);
  const todayCount = paidOrders.filter(
    (o) => Date.parse(o.created_at) >= todayStartMs,
  ).length;
  // Month-to-date paid revenue, for the plan banner's this-month comparison.
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthToDateCents = paidOrders
    .filter((o) => Date.parse(o.created_at) >= monthStart.getTime())
    .reduce((s, o) => s + (o.total_cents || 0), 0);

  const sevenDayCents = sumIn(7 * ONE_DAY);
  const sevenDayCount = countIn(7 * ONE_DAY);
  const thirtyDayCents = sumIn(30 * ONE_DAY);
  const thirtyDayCount = countIn(30 * ONE_DAY);

  // Attention strip — highlight things that need an admin's eyes.
  const productRows = (products ?? []) as ProductRow[];
  const outOfStock = productRows.filter(
    (p) => p.in_stock === 0 && !p.preorder_only,
  );
  const lowStock = productRows.filter(
    (p) => p.in_stock > 0 && p.in_stock < 50 && !p.preorder_only,
  );

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

        <PlanBanner
          actualRevenueCents={monthToDateCents}
          actualDoors={approvedDoors ?? undefined}
        />

        <div className="dashboard-grid">
          <div className="stat-card">
            <p className="stat-label">
              paid revenue {financials ? '· stripe' : ''}
            </p>
            <p className="stat-value">{formatCentsToUSD(paidRevenueDisplay)}</p>
            {financials && financials.stripe.refundedCents > 0 ? (
              <p className="stat-label" style={{ marginTop: '0.35rem' }}>
                gross {formatCentsToUSD(financials.stripe.grossCents)} − refunds{' '}
                {formatCentsToUSD(financials.stripe.refundedCents)}
              </p>
            ) : null}
          </div>
          <div className="stat-card">
            <p className="stat-label">net profit</p>
            <p
              className="stat-value"
              style={{
                color:
                  netProfitCents >= 0
                    ? 'var(--c-lime)'
                    : 'var(--c-magenta)',
              }}
            >
              {formatCentsToUSD(netProfitCents)}
            </p>
            <p className="stat-label" style={{ marginTop: '0.35rem' }}>
              after cogs + expenses
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">cash donations</p>
            <p className="stat-value">{formatCentsToUSD(cashDonationCents)}</p>
            <p className="stat-label" style={{ marginTop: '0.35rem' }}>
              logged manually
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">orders (paid · pending)</p>
            <p className="stat-value">
              {stats.totalOrders - stats.pendingOrders} ·{' '}
              <span style={{ color: 'var(--c-sodium)' }}>
                {stats.pendingOrders}
              </span>
            </p>
            <p className="stat-label" style={{ marginTop: '0.35rem' }}>
              pending = {formatCentsToUSD(stats.pendingRevenue)} on the table
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">marketing list</p>
            <p className="stat-value">
              {listTotals ? listTotals.opted_in : '—'}{' '}
              <span style={{ color: 'var(--admin-text-soft)', fontSize: '0.55em' }}>
                / {listTotals ? listTotals.total : '—'}
              </span>
            </p>
            <p className="stat-label" style={{ marginTop: '0.35rem' }}>
              opted-in / total contacts
            </p>
          </div>
        </div>

        <div className="dashboard-recency">
          <div className="recency-card">
            <p className="recency-label">today</p>
            <p className="recency-value">{formatCentsToUSD(todayCents)}</p>
            <p className="recency-meta">
              {todayCount} order{todayCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="recency-card">
            <p className="recency-label">last 7 days</p>
            <p className="recency-value">{formatCentsToUSD(sevenDayCents)}</p>
            <p className="recency-meta">
              {sevenDayCount} order{sevenDayCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="recency-card">
            <p className="recency-label">last 30 days</p>
            <p className="recency-value">{formatCentsToUSD(thirtyDayCents)}</p>
            <p className="recency-meta">
              {thirtyDayCount} order{thirtyDayCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="recency-card">
            <p className="recency-label">products live</p>
            <p className="recency-value">{stats.totalProducts}</p>
            <p className="recency-meta">
              {outOfStock.length} out of stock · {lowStock.length} low
            </p>
          </div>
        </div>

        {(stats.pendingOrders > 0 ||
          outOfStock.length > 0 ||
          lowStock.length > 0) && (
          <div className="attention-strip">
            <p className="attention-strip-title">needs attention</p>
            <div className="attention-strip-items">
              {stats.pendingOrders > 0 && (
                <Link href="/admin/orders" className="attention-chip attention-chip--warn">
                  {stats.pendingOrders} pending order
                  {stats.pendingOrders === 1 ? '' : 's'} ›
                </Link>
              )}
              {outOfStock.length > 0 && (
                <Link
                  href="/admin/inventory"
                  className="attention-chip attention-chip--alert"
                >
                  {outOfStock.length} out of stock ›
                </Link>
              )}
              {lowStock.length > 0 && (
                <Link
                  href="/admin/inventory"
                  className="attention-chip attention-chip--info"
                >
                  {lowStock.length} low stock ›
                </Link>
              )}
            </div>
          </div>
        )}

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
                  {(orders as OrderRow[]).slice(0, 5).map((order) => {
                    const statusColor =
                      order.status === 'paid' || order.status === 'completed'
                        ? 'var(--c-lime)'
                        : order.status === 'shipped'
                          ? 'var(--c-cyan)'
                          : order.status === 'cancelled'
                            ? 'var(--c-magenta)'
                            : 'var(--c-sodium)';
                    return (
                      <tr key={order.id}>
                        <td className="font-mono text-sm">
                          {order.id.slice(0, 8)}…
                        </td>
                        <td>
                          <span
                            className="px-2 py-1 text-xs font-bold rounded"
                            style={{
                              color: statusColor,
                              background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${statusColor} 35%, transparent)`,
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{formatCentsToUSD(order.total_cents)}</td>
                        <td className="text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
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
                kitty + the other three flavors.
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
