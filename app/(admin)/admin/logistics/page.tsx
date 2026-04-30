'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

interface Shipment {
  id: string;
  order_id: string;
  carrier: string;
  tracking_number: string;
  label_url: string;
  shipped_at: string;
  delivered_at: string;
}

interface Return {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  refund_amount_cents: number;
  created_at: string;
}

export default function LogisticsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    fetchShipments();
    fetchReturns();
  }, []);

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('shipped_at', { ascending: false });

    if (!error && data) {
      setShipments(data);
    }
  };

  const fetchReturns = async () => {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReturns(data);
    }
  };

  const handleShipmentUpdate = async (
    shipmentId: string,
    field: string,
    value: string
  ) => {
    const { error } = await supabase
      .from('shipments')
      .update({ [field]: value })
      .eq('id', shipmentId);

    if (!error) {
      fetchShipments();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Logistics & Returns</h1>

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
                      className={selectedShipment?.id === shipment.id ? 'bg-light' : ''}
                    >
                      <td className="text-sm font-mono">
                        {shipment.order_id.slice(0, 8)}...
                      </td>
                      <td className="capitalize">{shipment.carrier}</td>
                      <td className="text-sm">{shipment.tracking_number}</td>
                      <td>
                        <span className="px-2 py-1 text-xs font-bold rounded bg-light">
                          {shipment.delivered_at
                            ? 'Delivered'
                            : 'In Transit'}
                        </span>
                      </td>
                      <td className="text-sm">
                        {new Date(shipment.shipped_at).toLocaleDateString()}
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
                  </tr>
                </thead>
                <tbody>
                  {returns.map((ret) => (
                    <tr key={ret.id}>
                      <td className="text-sm font-mono">
                        {ret.order_id.slice(0, 8)}...
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
                      <td>${(ret.refund_amount_cents / 100).toFixed(2)}</td>
                      <td className="text-sm">
                        {new Date(ret.created_at).toLocaleDateString()}
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
                <p className="font-bold capitalize">{selectedShipment.carrier}</p>
              </div>

              <div>
                <p className="text-gray-600">Tracking Number</p>
                <p className="font-mono font-bold">
                  {selectedShipment.tracking_number}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-bold">
                  {selectedShipment.delivered_at ? 'Delivered' : 'In Transit'}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Shipped</p>
                <p className="text-xs">
                  {new Date(selectedShipment.shipped_at).toLocaleString()}
                </p>
              </div>

              {selectedShipment.delivered_at && (
                <div>
                  <p className="text-gray-600">Delivered</p>
                  <p className="text-xs">
                    {new Date(selectedShipment.delivered_at).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedShipment.label_url && (
                <div>
                  <a
                    href={selectedShipment.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold text-sm"
                  >
                    Download Label
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
