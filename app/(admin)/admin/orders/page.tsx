'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useOrders, useOrderWithItems } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';

interface ShippingAddress {
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  kind?: string | null;
  donorName?: string | null;
  donationMessage?: string | null;
}

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  user_email: string | null;
  created_at: string;
  shipping_address: ShippingAddress | null;
  stripe_payment_intent_id?: string | null;
}

interface ShipmentRow {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
  label_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

interface ReconcileSummary {
  scanned_sessions: number;
  pending_orders_before: number;
  matched: number;
  marked_paid: number;
  marked_cancelled: number;
  errors: string[];
  changes: Array<{
    order_id: string;
    new_status: string;
    payment_intent_id: string | null;
  }>;
}

interface BulkLabelResult {
  orderId: string;
  ok: boolean;
  trackingNumber?: string;
  rateCents?: number;
  error?: string;
  reused?: boolean;
}

interface BulkLabelResponse {
  results: BulkLabelResult[];
  pdfB64: string | null;
  succeeded: number;
  failed: number;
}

type SectionKey =
  | 'to_fulfill'
  | 'shipped'
  | 'completed'
  | 'donations'
  | 'pending'
  | 'cancelled';

const SECTION_ORDER: SectionKey[] = [
  'to_fulfill',
  'shipped',
  'completed',
  'donations',
  'pending',
  'cancelled',
];

const SECTION_LABELS: Record<SectionKey, string> = {
  to_fulfill: 'to fulfill',
  shipped: 'shipped',
  completed: 'completed',
  donations: 'donations',
  pending: 'awaiting payment',
  cancelled: 'cancelled',
};

const SECTION_COLORS: Record<SectionKey, string> = {
  to_fulfill: 'var(--c-sodium)',
  shipped: 'var(--c-cyan)',
  completed: 'var(--c-lime)',
  donations: 'var(--c-uv)',
  pending: 'var(--c-magenta)',
  cancelled: 'var(--admin-text-soft)',
};

const SECTION_STORAGE_KEY = 'kp-admin-orders-section';

function categorize(o: OrderRow): SectionKey {
  if (o.shipping_address?.kind === 'donation') return 'donations';
  if (o.status === 'pending') return 'pending';
  if (o.status === 'cancelled') return 'cancelled';
  if (o.status === 'completed') return 'completed';
  if (o.status === 'shipped') return 'shipped';
  if (o.status === 'paid') return 'to_fulfill';
  return 'pending';
}

function fullName(addr: ShippingAddress | null | undefined): string {
  if (!addr) return '';
  if (addr.kind === 'donation') return addr.donorName?.trim() || '';
  return [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim();
}

function ageLabel(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d`;
  const hrs = Math.floor(ms / (60 * 60 * 1000));
  if (hrs >= 1) return `${hrs}h`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `${mins}m`;
}

function downloadBase64Pdf(b64: string, filename: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 200);
}

export default function OrdersPage() {
  const { data: orders, isLoading, refetch } = useOrders();
  const queryClient = useQueryClient();

  const [section, setSection] = useState<SectionKey>('to_fulfill');
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] =
    useState<ReconcileSummary | null>(null);
  const [reconcileError, setReconcileError] = useState<string>('');

  const [bulkBusy, setBulkBusy] = useState<
    'labels' | 'shipped' | 'completed' | null
  >(null);
  const [bulkResult, setBulkResult] = useState<BulkLabelResponse | null>(null);
  const [bulkError, setBulkError] = useState<string>('');

  // Restore last-active section from localStorage so admins land where they
  // left off (usually 'to_fulfill').
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SECTION_STORAGE_KEY);
      if (
        stored &&
        (SECTION_ORDER as string[]).includes(stored)
      ) {
        setSection(stored as SectionKey);
      }
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(SECTION_STORAGE_KEY, section);
    } catch {
      // ignore
    }
    // Selection only makes sense within the current section; clear when
    // jumping tabs.
    setSelected(new Set());
    setBulkResult(null);
    setBulkError('');
  }, [section]);

  const grouped = useMemo(() => {
    const buckets: Record<SectionKey, OrderRow[]> = {
      to_fulfill: [],
      shipped: [],
      completed: [],
      donations: [],
      pending: [],
      cancelled: [],
    };
    ((orders ?? []) as OrderRow[]).forEach((o) => {
      buckets[categorize(o)].push(o);
    });
    // FIFO on to_fulfill (oldest first — that's the order to ship them).
    buckets.to_fulfill.sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    );
    return buckets;
  }, [orders]);

  const sectionOrders = grouped[section];
  const showCheckboxes = section === 'to_fulfill';

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === sectionOrders.length) return new Set();
      return new Set(sectionOrders.map((o) => o.id));
    });
  };

  const handleReconcile = async () => {
    if (reconciling) return;
    if (
      !confirm(
        'Pull recent Stripe Checkout Sessions (last 60 days) and update any pending orders whose payment actually completed? Safe to run repeatedly.',
      )
    )
      return;
    setReconciling(true);
    setReconcileError('');
    setReconcileResult(null);
    try {
      const response = await fetch('/api/admin/orders/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'reconcile failed');
      setReconcileResult(json.summary as ReconcileSummary);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setReconcileError(err instanceof Error ? err.message : 'reconcile failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleBulkLabels = async () => {
    if (bulkBusy || selected.size === 0) return;
    setBulkBusy('labels');
    setBulkError('');
    setBulkResult(null);
    try {
      const response = await fetch('/api/admin/orders/bulk-buy-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [...selected] }),
      });
      const json = (await response.json()) as
        | BulkLabelResponse
        | { error: string };
      if (!response.ok) {
        throw new Error(
          'error' in json ? json.error : 'bulk-buy-labels failed',
        );
      }
      const result = json as BulkLabelResponse;
      setBulkResult(result);
      if (result.pdfB64) {
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        downloadBase64Pdf(result.pdfB64, `kiwipop-labels-${stamp}.pdf`);
      }
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelected(new Set());
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'bulk-buy-labels failed');
    } finally {
      setBulkBusy(null);
    }
  };

  const handleBulkStatus = async (status: 'shipped' | 'completed') => {
    if (bulkBusy || selected.size === 0) return;
    setBulkBusy(status);
    setBulkError('');
    setBulkResult(null);
    try {
      const response = await fetch('/api/admin/orders/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [...selected], status }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'bulk status failed');
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelected(new Set());
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'bulk status failed');
    } finally {
      setBulkBusy(null);
    }
  };

  const handlePackingSlips = () => {
    if (selected.size === 0) return;
    const ids = [...selected].join(',');
    window.open(
      `/api/admin/orders/packing-slips?ids=${encodeURIComponent(ids)}`,
      '_blank',
    );
  };

  // Prev/next nav inside the modal — walks through the currently-visible
  // section orders.
  const sectionIds = useMemo(
    () => sectionOrders.map((o) => o.id),
    [sectionOrders],
  );
  const goToOrder = (delta: 1 | -1) => {
    if (!modalOrderId) return;
    const idx = sectionIds.indexOf(modalOrderId);
    if (idx < 0) return;
    const next = sectionIds[idx + delta];
    if (next) setModalOrderId(next);
  };

  return (
    <AdminLayout>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <h1 className="text-3xl font-bold">Orders</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReconcile}
          disabled={reconciling}
        >
          {reconciling ? 'reconciling…' : 'reconcile with stripe'}
        </button>
      </div>

      {reconcileError && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {reconcileError}
        </div>
      )}
      {reconcileResult && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          scanned <b>{reconcileResult.scanned_sessions}</b> stripe sessions ·
          marked paid <b>{reconcileResult.marked_paid}</b> · cancelled{' '}
          <b>{reconcileResult.marked_cancelled}</b>
        </div>
      )}

      {/* Section tabs */}
      <div className="orders-section-tabs">
        {SECTION_ORDER.map((key) => {
          const count = grouped[key].length;
          const active = key === section;
          return (
            <button
              key={key}
              type="button"
              className={`orders-section-tab${active ? ' is-active' : ''}`}
              onClick={() => setSection(key)}
              style={
                {
                  '--tab-c': SECTION_COLORS[key],
                } as React.CSSProperties
              }
            >
              <span className="orders-section-tab-label">
                {SECTION_LABELS[key]}
              </span>
              <span className="orders-section-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk action bar — only on to_fulfill, only when something selected */}
      {showCheckboxes && selected.size > 0 && (
        <div className="orders-bulk-bar">
          <div className="orders-bulk-bar-count">
            <strong>{selected.size}</strong> selected
          </div>
          <div className="orders-bulk-bar-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBulkLabels}
              disabled={!!bulkBusy}
            >
              {bulkBusy === 'labels'
                ? 'buying & merging…'
                : `buy ${selected.size} USPS label${selected.size === 1 ? '' : 's'}`}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePackingSlips}
              disabled={!!bulkBusy}
            >
              print packing slips
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleBulkStatus('shipped')}
              disabled={!!bulkBusy}
            >
              {bulkBusy === 'shipped' ? '…' : 'mark shipped'}
            </button>
            <button
              type="button"
              className="orders-bulk-bar-clear"
              onClick={() => setSelected(new Set())}
            >
              clear
            </button>
          </div>
        </div>
      )}

      {bulkError && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {bulkError}
        </div>
      )}
      {bulkResult && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          bought <b>{bulkResult.succeeded}</b> label
          {bulkResult.succeeded === 1 ? '' : 's'}
          {bulkResult.failed > 0 ? (
            <>
              {' '}
              · <b>{bulkResult.failed}</b> failed:{' '}
              {bulkResult.results
                .filter((r) => !r.ok)
                .map((r) => `${r.orderId.slice(0, 8)} (${r.error})`)
                .join(' · ')}
            </>
          ) : null}
          {bulkResult.pdfB64 ? ' · combined PDF downloading' : ''}
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : sectionOrders.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--admin-text-soft)' }}>
            No {SECTION_LABELS[section]} orders.
          </p>
        ) : (
          <table className="table orders-table">
            <thead>
              <tr>
                {showCheckboxes && (
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      aria-label="select all"
                      checked={
                        selected.size === sectionOrders.length &&
                        sectionOrders.length > 0
                      }
                      onChange={toggleAll}
                    />
                  </th>
                )}
                <th>Customer</th>
                <th>Location</th>
                <th>Email</th>
                <th>Total</th>
                <th>Age</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sectionOrders.map((order) => {
                const checked = selected.has(order.id);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setModalOrderId(order.id)}
                    style={{ cursor: 'pointer' }}
                    className={checked ? 'is-selected' : ''}
                  >
                    {showCheckboxes && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(order.id)}
                          aria-label={`select order ${order.id.slice(0, 8)}`}
                        />
                      </td>
                    )}
                    <td className="text-sm">
                      {fullName(order.shipping_address) || '—'}
                    </td>
                    <td className="text-sm">
                      {order.shipping_address?.city
                        ? `${order.shipping_address.city}, ${order.shipping_address.state ?? ''}`
                        : '—'}
                    </td>
                    <td className="text-sm">{order.user_email || 'N/A'}</td>
                    <td>{formatCentsToUSD(order.total_cents)}</td>
                    <td className="text-sm">{ageLabel(order.created_at)}</td>
                    <td className="text-sm font-mono" style={{ opacity: 0.65 }}>
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="text-sm" style={{ color: 'var(--admin-text-soft)' }}>
                      open ›
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOrderId && (
        <OrderModal
          orderId={modalOrderId}
          onClose={() => setModalOrderId(null)}
          onChanged={async () => {
            await refetch();
            await queryClient.invalidateQueries({ queryKey: ['orders'] });
          }}
          onPrev={
            sectionIds.indexOf(modalOrderId) > 0
              ? () => goToOrder(-1)
              : null
          }
          onNext={
            sectionIds.indexOf(modalOrderId) <
            sectionIds.length - 1
              ? () => goToOrder(1)
              : null
          }
        />
      )}
    </AdminLayout>
  );
}

/* -----------------------------------------------------------
   ORDER MODAL — full shipping/items detail + actions + nav
   ----------------------------------------------------------- */

interface OrderModalProps {
  orderId: string;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

function OrderModal({
  orderId,
  onClose,
  onChanged,
  onPrev,
  onNext,
}: OrderModalProps) {
  const queryClient = useQueryClient();
  const { data: order, refetch: refetchOrder } = useOrderWithItems(orderId);

  const [shipment, setShipment] = useState<ShipmentRow | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(true);

  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string>('');

  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState<string>('');
  const [labelMeta, setLabelMeta] = useState<{
    rateCents?: number;
    serviceLevel?: string;
  }>({});

  // Esc to close, ←/→ to nav, lock scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  // Reset modal state when navigating between orders
  useEffect(() => {
    setShipment(null);
    setShipmentLoading(true);
    setLabelError('');
    setLabelMeta({});
    setStatusError('');
    setPendingStatus(null);
  }, [orderId]);

  // Fetch existing shipment record
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setShipmentLoading(true);
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/shipment`, {
          cache: 'no-store',
        });
        const json = await response.json();
        if (!cancelled && response.ok) {
          setShipment(json.shipment as ShipmentRow | null);
        }
      } catch {
        // soft fail
      } finally {
        if (!cancelled) setShipmentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const isDonation = order?.shipping_address?.kind === 'donation';

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setStatusError('');
    setPendingStatus(newStatus);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to update order');
      }
      await refetchOrder();
      await queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      await onChanged();
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : 'Failed to update order',
      );
    } finally {
      setPendingStatus(null);
    }
  };

  const handleBuyLabel = async () => {
    if (!order || labelLoading) return;
    setLabelLoading(true);
    setLabelError('');
    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/buy-label`,
        { method: 'POST' },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'failed to buy label');
      setShipment(json.shipment as ShipmentRow);
      setLabelMeta({
        rateCents: json.rateCents,
        serviceLevel: json.serviceLevel,
      });
      await refetchOrder();
      await onChanged();
    } catch (err) {
      setLabelError(err instanceof Error ? err.message : 'failed to buy label');
    } finally {
      setLabelLoading(false);
    }
  };

  return (
    <div className="orders-modal-overlay" onClick={onClose}>
      <div
        className="orders-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="order details"
      >
        <div className="orders-modal-nav">
          <button
            type="button"
            className="orders-modal-nav-btn"
            onClick={() => onPrev && onPrev()}
            disabled={!onPrev}
            aria-label="previous order"
            title="previous (←)"
          >
            ‹
          </button>
          <button
            type="button"
            className="orders-modal-nav-btn"
            onClick={() => onNext && onNext()}
            disabled={!onNext}
            aria-label="next order"
            title="next (→)"
          >
            ›
          </button>
          <button
            type="button"
            className="orders-modal-close"
            onClick={onClose}
            aria-label="close"
            title="close (Esc)"
          >
            ×
          </button>
        </div>

        {!order ? (
          <p style={{ padding: '2rem' }}>loading…</p>
        ) : (
          <>
            <header className="orders-modal-header">
              <span
                className="orders-modal-tag"
                style={{
                  color: SECTION_COLORS[categorize(order as OrderRow)],
                  borderColor: SECTION_COLORS[categorize(order as OrderRow)],
                }}
              >
                {SECTION_LABELS[categorize(order as OrderRow)]}
              </span>
              <h2 className="card-title" style={{ margin: 0 }}>
                Order {order.id.slice(0, 8)}…
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--admin-text-soft)',
                  fontFamily: 'var(--mono)',
                }}
              >
                placed {new Date(order.created_at).toLocaleString()}
              </p>
            </header>

            <div className="orders-modal-grid">
              <section>
                <h3 className="orders-modal-section-title">Customer</h3>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>{fullName(order.shipping_address) || '—'}</strong>
                </p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  {order.user_email ?? 'no email'}
                </p>

                {isDonation ? (
                  <>
                    <h3 className="orders-modal-section-title" style={{ marginTop: 18 }}>
                      Donation
                    </h3>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      <em>no shipping — fundraiser tip</em>
                    </p>
                    {order.shipping_address?.donationMessage && (
                      <p
                        style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          background: 'var(--admin-surface-soft)',
                          borderRadius: 8,
                          fontSize: 13,
                          fontStyle: 'italic',
                          borderLeft: '3px solid var(--c-uv)',
                        }}
                      >
                        “{order.shipping_address.donationMessage}”
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="orders-modal-section-title" style={{ marginTop: 18 }}>
                      Ship to
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                      {order.shipping_address?.address || '—'}
                      <br />
                      {order.shipping_address?.city}
                      {order.shipping_address?.city ? ', ' : ''}
                      {order.shipping_address?.state}{' '}
                      {order.shipping_address?.zip}
                      <br />
                      {order.shipping_address?.country || 'US'}
                    </p>
                  </>
                )}
              </section>

              <section>
                <h3 className="orders-modal-section-title">Items</h3>
                <div className="orders-modal-items">
                  {order.items?.length ? (
                    order.items.map((item: any) => (
                      <div key={item.id} className="orders-modal-item">
                        <span className="orders-modal-item-name">
                          {item.products?.name ?? 'Unknown'}{' '}
                          <span style={{ color: 'var(--admin-text-soft)' }}>
                            × {item.quantity}
                          </span>
                        </span>
                        <span className="orders-modal-item-price">
                          {formatCentsToUSD(
                            (item.price_cents ?? 0) * (item.quantity ?? 1),
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 13 }}>no items</p>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    marginTop: 10,
                    borderTop: '1px solid var(--admin-border)',
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span>{formatCentsToUSD(order.total_cents)}</span>
                </div>
                {order.stripe_payment_intent_id && (
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      fontFamily: 'var(--mono)',
                      color: 'var(--admin-text-soft)',
                      wordBreak: 'break-all',
                    }}
                  >
                    pi: {order.stripe_payment_intent_id}
                  </p>
                )}
              </section>
            </div>

            {!isDonation && (
              <section className="orders-modal-shipping">
                <h3 className="orders-modal-section-title" style={{ marginTop: 0 }}>
                  Shipping label
                </h3>

                {shipmentLoading ? (
                  <p style={{ fontSize: 13 }}>checking…</p>
                ) : shipment && shipment.label_url ? (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13 }}>
                      <strong>{(shipment.carrier || '').toUpperCase()}</strong>{' '}
                      · tracking{' '}
                      <span style={{ fontFamily: 'var(--mono)' }}>
                        {shipment.tracking_number}
                      </span>
                      {shipment.shipped_at && (
                        <>
                          {' '}
                          · shipped{' '}
                          {new Date(shipment.shipped_at).toLocaleDateString()}
                        </>
                      )}
                    </p>
                    <a
                      href={shipment.label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Print label (PDF) →
                    </a>{' '}
                    <a
                      href={`/api/admin/orders/packing-slips?ids=${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Packing slip
                    </a>
                  </div>
                ) : (
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 13,
                        color: 'var(--admin-text-soft)',
                      }}
                    >
                      Buy the cheapest USPS service via ShipStation. Fulfills the
                      order and stamps it as shipped.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleBuyLabel}
                      disabled={
                        labelLoading ||
                        (order.status !== 'paid' && order.status !== 'shipped')
                      }
                    >
                      {labelLoading
                        ? 'buying label…'
                        : order.status === 'paid' || order.status === 'shipped'
                          ? 'buy USPS label'
                          : `cannot buy — order is ${order.status}`}
                    </button>{' '}
                    <a
                      href={`/api/admin/orders/packing-slips?ids=${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Packing slip
                    </a>
                    {labelError && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: 'var(--c-magenta-text)',
                        }}
                      >
                        {labelError}
                      </p>
                    )}
                    {labelMeta.rateCents != null && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: 'var(--admin-text-soft)',
                        }}
                      >
                        bought {labelMeta.serviceLevel} for{' '}
                        {formatCentsToUSD(labelMeta.rateCents)}
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="orders-modal-status">
              <h3 className="orders-modal-section-title" style={{ marginTop: 0 }}>
                Status
              </h3>
              <select
                value={pendingStatus ?? order.status}
                disabled={!!pendingStatus}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="form-select"
                style={{ maxWidth: 320 }}
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="shipped">shipped</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled (refunds Stripe)</option>
              </select>
              {statusError && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: 'var(--c-magenta-text)',
                  }}
                >
                  {statusError}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
