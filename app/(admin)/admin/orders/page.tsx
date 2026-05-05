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
  if (addr.kind === 'donation') {
    return addr.donorName?.trim() || '';
  }
  return [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim();
}

export default function OrdersPage() {
  const { data: orders, isLoading, refetch } = useOrders();
  const queryClient = useQueryClient();

  const [section, setSection] = useState<SectionKey>('to_fulfill');
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);

  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] =
    useState<ReconcileSummary | null>(null);
  const [reconcileError, setReconcileError] = useState<string>('');

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
    return buckets;
  }, [orders]);

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
      if (!response.ok) {
        throw new Error(json.error ?? 'reconcile failed');
      }
      setReconcileResult(json.summary as ReconcileSummary);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setReconcileError(err instanceof Error ? err.message : 'reconcile failed');
    } finally {
      setReconciling(false);
    }
  };

  const sectionOrders = grouped[section];

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
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: '1px solid var(--admin-border)',
            borderLeft: '3px solid var(--c-lime)',
            background: 'var(--admin-surface)',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            lineHeight: 1.6,
            borderRadius: 10,
          }}
        >
          <strong style={{ color: 'var(--c-lime-text)' }}>RESULT →</strong>{' '}
          scanned <b>{reconcileResult.scanned_sessions}</b> stripe sessions ·
          checked <b>{reconcileResult.pending_orders_before}</b> pending orders
          · matched <b>{reconcileResult.matched}</b> · marked paid{' '}
          <b>{reconcileResult.marked_paid}</b> · cancelled{' '}
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

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : sectionOrders.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--admin-text-soft)' }}>
            No {SECTION_LABELS[section]} orders.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sectionOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setModalOrderId(order.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="text-sm font-mono">
                    {order.id.slice(0, 8)}…
                  </td>
                  <td className="text-sm">{fullName(order.shipping_address) || '—'}</td>
                  <td className="text-sm">{order.user_email || 'N/A'}</td>
                  <td>{formatCentsToUSD(order.total_cents)}</td>
                  <td className="text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-sm" style={{ color: 'var(--admin-text-soft)' }}>
                    open ›
                  </td>
                </tr>
              ))}
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
        />
      )}
    </AdminLayout>
  );
}

/* -----------------------------------------------------------
   ORDER MODAL — full shipping/items detail + actions
   ----------------------------------------------------------- */

interface OrderModalProps {
  orderId: string;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

function OrderModal({ orderId, onClose, onChanged }: OrderModalProps) {
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

  // Esc to close, lock scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

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
      if (!response.ok) {
        throw new Error(json.error ?? 'failed to buy label');
      }
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
        <button
          type="button"
          className="orders-modal-close"
          onClick={onClose}
          aria-label="close"
        >
          ×
        </button>

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
              {/* CUSTOMER + ADDRESS */}
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

              {/* ITEMS + TOTAL */}
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

            {/* SHIPPING ACTIONS */}
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
                      Buy the cheapest USPS service via Shippo. Fulfills the
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
                    </button>
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

            {/* STATUS CONTROLS */}
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
