'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { useOrders, useOrderWithItems } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/format';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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

export default function OrdersPage() {
  const { data: orders, isLoading, refetch } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: selectedOrder } = useOrderWithItems(selectedOrderId || '');
  const [statusError, setStatusError] = useState<string>('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<ReconcileSummary | null>(null);
  const [reconcileError, setReconcileError] = useState<string>('');
  const queryClient = useQueryClient();

  const handleReconcile = async () => {
    if (reconciling) return;
    if (!confirm("Pull recent Stripe Checkout Sessions (last 60 days) and update any pending orders whose payment actually completed? Safe to run repeatedly.")) return;
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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setStatusError('');
    setPendingStatus(newStatus);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to update order');
      }
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : 'Failed to update order'
      );
    } finally {
      setPendingStatus(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      {statusError && (
        <div className="alert alert-error mb-4">{statusError}</div>
      )}

      <div className="card mb-4" style={{ padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <p className="card-title" style={{ margin: 0 }}>
              reconcile with stripe
            </p>
            <p
              style={{
                margin: '0.4rem 0 0',
                fontSize: 12,
                color: 'var(--bone)',
                lineHeight: 1.5,
              }}
            >
              pulls the last 60 days of stripe checkout sessions and flips any
              order still <code>pending</code> locally that&apos;s actually paid
              (or expired) on stripe. use this when the webhook hasn&apos;t
              fired but you know money landed. the dashboard + financials
              pages auto-run this on every visit, so this button is a manual
              backstop.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleReconcile}
            disabled={reconciling}
          >
            {reconciling ? 'reconciling…' : 'reconcile now'}
          </button>
        </div>

        {reconcileError ? (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            {reconcileError}
          </div>
        ) : null}

        {reconcileResult ? (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              border: '1px solid var(--lime)',
              background: 'rgba(168, 255, 60, 0.06)',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--c-lime-text)' }}>RESULT →</strong>{' '}
            scanned <b>{reconcileResult.scanned_sessions}</b> stripe sessions ·
            checked <b>{reconcileResult.pending_orders_before}</b> pending
            orders · matched <b>{reconcileResult.matched}</b> · marked paid{' '}
            <b>{reconcileResult.marked_paid}</b> · cancelled{' '}
            <b>{reconcileResult.marked_cancelled}</b>
            {reconcileResult.errors.length > 0 ? (
              <div style={{ color: 'var(--c-magenta-text)', marginTop: 6 }}>
                errors: {reconcileResult.errors.join(' · ')}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="card-title">All Orders</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : orders && orders.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      style={{ cursor: 'pointer' }}
                      className={selectedOrderId === order.id ? 'bg-light' : ''}
                    >
                      <td className="text-sm font-mono">{order.id.slice(0, 8)}...</td>
                      <td className="text-sm">{order.user_email || 'N/A'}</td>
                      <td>
                        <span className="px-2 py-1 text-xs font-bold rounded bg-light">
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
              <p>No orders yet</p>
            )}
          </div>
        </div>

        {selectedOrder && (
          <div className="card">
            <h2 className="card-title">Order Details</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Order ID</p>
                <p className="font-mono text-xs break-all">{selectedOrder.id}</p>
              </div>

              <div>
                <p className="text-gray-600">Email</p>
                <p>{selectedOrder.user_email || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-600">Status</p>
                <select
                  value={pendingStatus ?? selectedOrder.status}
                  disabled={!!pendingStatus}
                  onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled (refunds Stripe)</option>
                </select>
              </div>

              <div>
                <p className="text-gray-600">Total</p>
                <p className="text-lg font-bold">
                  {formatCentsToUSD(selectedOrder.total_cents)}
                </p>
              </div>

              <div>
                <p className="text-gray-600 mb-2">Items</p>
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="text-xs bg-light p-2 rounded mb-1">
                    {item.products?.name || 'Unknown'} x{item.quantity}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-gray-600">Shipping Address</p>
                <p className="text-xs">
                  {selectedOrder.shipping_address?.address}
                  <br />
                  {selectedOrder.shipping_address?.city},{' '}
                  {selectedOrder.shipping_address?.state}{' '}
                  {selectedOrder.shipping_address?.zip}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Created</p>
                <p className="text-xs">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
