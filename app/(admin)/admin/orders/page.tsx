'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { useOrders, useOrderWithItems } from '@/lib/hooks';
import { formatCentsToUSD } from '@/lib/format';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function OrdersPage() {
  const { data: orders, isLoading, refetch } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: selectedOrder } = useOrderWithItems(selectedOrderId || '');
  const [statusError, setStatusError] = useState<string>('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
