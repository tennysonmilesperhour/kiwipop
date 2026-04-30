'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/format';
import { useState, useEffect } from 'react';

interface Shipment {
  id: string;
  order_id: string;
  carrier: 'usps' | 'ups' | 'fedex';
  tracking_number: string;
  label_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface ReturnRow {
  id: string;
  order_id: string;
  reason: string;
  status: 'pending' | 'received' | 'refunded' | 'rejected';
  refund_amount_cents: number;
  created_at: string;
}

interface OrderOption {
  id: string;
  user_email: string | null;
  status: string;
  total_cents: number;
}

type Drawer = 'none' | 'shipment' | 'return';

interface ShipmentForm {
  order_id: string;
  carrier: 'usps' | 'ups' | 'fedex';
  tracking_number: string;
  label_url: string;
}

const EMPTY_SHIPMENT: ShipmentForm = {
  order_id: '',
  carrier: 'usps',
  tracking_number: '',
  label_url: '',
};

interface ReturnForm {
  order_id: string;
  reason: string;
  refundUsd: string;
  status: ReturnRow['status'];
}

const EMPTY_RETURN: ReturnForm = {
  order_id: '',
  reason: '',
  refundUsd: '',
  status: 'pending',
};

export default function LogisticsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null
  );
  const [selectedReturn, setSelectedReturn] = useState<ReturnRow | null>(null);
  const [drawer, setDrawer] = useState<Drawer>('none');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const [shipmentForm, setShipmentForm] = useState<ShipmentForm>(EMPTY_SHIPMENT);
  const [returnForm, setReturnForm] = useState<ReturnForm>(EMPTY_RETURN);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [shipRes, retRes, orderRes] = await Promise.all([
      supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, user_email, status, total_cents')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    setShipments(shipRes.data ?? []);
    setReturns(retRes.data ?? []);
    setOrders(orderRes.data ?? []);
    setLoading(false);
  };

  const submit = async <T,>(
    url: string,
    method: 'POST' | 'PATCH',
    payload: T
  ) => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Save failed');
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentForm.order_id) {
      setError('Pick an order to ship');
      return;
    }
    try {
      await submit('/api/admin/shipments', 'POST', {
        order_id: shipmentForm.order_id,
        carrier: shipmentForm.carrier,
        tracking_number: shipmentForm.tracking_number.trim(),
        label_url: shipmentForm.label_url.trim() || undefined,
      });
      setShipmentForm(EMPTY_SHIPMENT);
      setDrawer('none');
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const markDelivered = async (shipment: Shipment) => {
    try {
      await submit(`/api/admin/shipments/${shipment.id}`, 'PATCH', {
        delivered_at: new Date().toISOString(),
      });
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.order_id) {
      setError('Pick an order for the return');
      return;
    }
    const cents = returnForm.refundUsd
      ? Math.round(parseFloat(returnForm.refundUsd) * 100)
      : 0;
    try {
      await submit('/api/admin/returns', 'POST', {
        order_id: returnForm.order_id,
        reason: returnForm.reason.trim(),
        refund_amount_cents: cents,
        status: returnForm.status,
      });
      setReturnForm(EMPTY_RETURN);
      setDrawer('none');
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const processRefund = async (ret: ReturnRow) => {
    if (
      !confirm(
        `Issue Stripe refund of ${formatCentsToUSD(
          ret.refund_amount_cents
        )} for this return?`
      )
    )
      return;
    try {
      await submit(`/api/admin/returns/${ret.id}`, 'PATCH', {
        process_refund: true,
      });
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const updateReturnStatus = async (
    ret: ReturnRow,
    status: ReturnRow['status']
  ) => {
    try {
      await submit(`/api/admin/returns/${ret.id}`, 'PATCH', { status });
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Logistics & Returns</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setDrawer('shipment');
              setShipmentForm(EMPTY_SHIPMENT);
            }}
            className="btn btn-primary"
          >
            + New Shipment
          </button>
          <button
            onClick={() => {
              setDrawer('return');
              setReturnForm(EMPTY_RETURN);
            }}
            className="btn"
          >
            + New Return
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Total Shipments</p>
          <p className="text-2xl font-bold">{shipments.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">In Transit</p>
          <p className="text-2xl font-bold">
            {shipments.filter((s) => s.shipped_at && !s.delivered_at).length}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Pending Returns</p>
          <p className="text-2xl font-bold">
            {returns.filter((r) => r.status === 'pending').length}
          </p>
        </div>
      </div>

      {drawer === 'shipment' && (
        <div className="card mb-6">
          <h2 className="card-title">New Shipment</h2>
          <form onSubmit={handleCreateShipment}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="form-label">Order *</label>
                <select
                  value={shipmentForm.order_id}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      order_id: e.target.value,
                    })
                  }
                  className="form-select"
                  required
                >
                  <option value="">— select an order —</option>
                  {orders
                    .filter(
                      (o) => o.status === 'paid' || o.status === 'shipped'
                    )
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id.slice(0, 8)}… — {o.user_email ?? 'guest'} —{' '}
                        {formatCentsToUSD(o.total_cents)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Carrier *</label>
                <select
                  value={shipmentForm.carrier}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      carrier: e.target.value as ShipmentForm['carrier'],
                    })
                  }
                  className="form-select"
                >
                  <option value="usps">USPS</option>
                  <option value="ups">UPS</option>
                  <option value="fedex">FedEx</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tracking number *</label>
                <input
                  type="text"
                  value={shipmentForm.tracking_number}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      tracking_number: e.target.value,
                    })
                  }
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Label URL</label>
                <input
                  type="url"
                  value={shipmentForm.label_url}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      label_url: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="https://… (optional)"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Create shipment'}
              </button>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {drawer === 'return' && (
        <div className="card mb-6">
          <h2 className="card-title">New Return / RMA</h2>
          <form onSubmit={handleCreateReturn}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="form-label">Order *</label>
                <select
                  value={returnForm.order_id}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, order_id: e.target.value })
                  }
                  className="form-select"
                  required
                >
                  <option value="">— select an order —</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id.slice(0, 8)}… — {o.user_email ?? 'guest'} —{' '}
                      {formatCentsToUSD(o.total_cents)} ({o.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Refund amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={returnForm.refundUsd}
                  onChange={(e) =>
                    setReturnForm({
                      ...returnForm,
                      refundUsd: e.target.value,
                    })
                  }
                  placeholder="leave blank for full order amount"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial status</label>
                <select
                  value={returnForm.status}
                  onChange={(e) =>
                    setReturnForm({
                      ...returnForm,
                      status: e.target.value as ReturnRow['status'],
                    })
                  }
                  className="form-select"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Reason *</label>
                <textarea
                  value={returnForm.reason}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, reason: e.target.value })
                  }
                  rows={2}
                  className="form-textarea"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save return'}
              </button>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="card-title">Shipments</h2>
            {loading ? (
              <p>Loading...</p>
            ) : shipments.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Carrier</th>
                    <th>Tracking</th>
                    <th>Status</th>
                    <th>Shipped</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      style={{ cursor: 'pointer' }}
                      className={
                        selectedShipment?.id === shipment.id ? 'bg-light' : ''
                      }
                    >
                      <td className="text-sm font-mono">
                        {shipment.order_id.slice(0, 8)}…
                      </td>
                      <td className="capitalize">{shipment.carrier}</td>
                      <td className="text-sm">{shipment.tracking_number}</td>
                      <td>
                        <span className="px-2 py-1 text-xs font-bold rounded bg-light">
                          {shipment.delivered_at ? 'Delivered' : 'In transit'}
                        </span>
                      </td>
                      <td className="text-sm">
                        {shipment.shipped_at
                          ? new Date(shipment.shipped_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No shipments yet</p>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Returns</h2>
            {returns.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Refund</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((ret) => (
                    <tr
                      key={ret.id}
                      onClick={() => setSelectedReturn(ret)}
                      style={{ cursor: 'pointer' }}
                      className={
                        selectedReturn?.id === ret.id ? 'bg-light' : ''
                      }
                    >
                      <td className="text-sm font-mono">
                        {ret.order_id.slice(0, 8)}…
                      </td>
                      <td className="text-sm">{ret.reason}</td>
                      <td>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            ret.status === 'refunded'
                              ? 'bg-green-100 text-green-800'
                              : ret.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {ret.status}
                        </span>
                      </td>
                      <td>{formatCentsToUSD(ret.refund_amount_cents ?? 0)}</td>
                      <td className="text-sm">
                        {new Date(ret.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-sm">
                        {ret.status !== 'refunded' &&
                          ret.status !== 'rejected' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                processRefund(ret);
                              }}
                              className="text-primary font-bold"
                            >
                              Refund
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No returns yet</p>
            )}
          </div>
        </div>

        {selectedShipment && (
          <div className="card">
            <h2 className="card-title">Shipment Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Order ID</p>
                <p className="font-mono text-xs break-all">
                  {selectedShipment.order_id}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Carrier</p>
                <p className="font-bold capitalize">
                  {selectedShipment.carrier}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Tracking</p>
                <p className="font-mono font-bold">
                  {selectedShipment.tracking_number}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-bold">
                  {selectedShipment.delivered_at ? 'Delivered' : 'In transit'}
                </p>
              </div>
              {selectedShipment.label_url && (
                <a
                  href={selectedShipment.label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold text-sm block"
                >
                  Download label
                </a>
              )}
              {!selectedShipment.delivered_at && (
                <button
                  onClick={() => markDelivered(selectedShipment)}
                  className="btn btn-primary btn-full"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : 'Mark delivered'}
                </button>
              )}
            </div>
          </div>
        )}

        {selectedReturn && !selectedShipment && (
          <div className="card">
            <h2 className="card-title">Return Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Order ID</p>
                <p className="font-mono text-xs break-all">
                  {selectedReturn.order_id}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Reason</p>
                <p className="text-xs whitespace-pre-wrap">
                  {selectedReturn.reason}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Refund amount</p>
                <p className="font-bold">
                  {formatCentsToUSD(selectedReturn.refund_amount_cents ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <select
                  value={selectedReturn.status}
                  onChange={(e) =>
                    updateReturnStatus(
                      selectedReturn,
                      e.target.value as ReturnRow['status']
                    )
                  }
                  className="form-select text-sm"
                  disabled={selectedReturn.status === 'refunded'}
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="rejected">Rejected</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              {selectedReturn.status !== 'refunded' &&
                selectedReturn.status !== 'rejected' && (
                  <button
                    onClick={() => processRefund(selectedReturn)}
                    className="btn btn-primary btn-full"
                    disabled={submitting}
                  >
                    {submitting ? 'Refunding…' : 'Process Stripe refund'}
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
