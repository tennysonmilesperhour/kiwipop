'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { formatCentsToUSD } from '@/lib/stripe';

interface ManufacturingBatch {
  id: string;
  batch_number: string;
  product_id: string;
  quantity_ordered: number;
  quantity_completed: number;
  status: string;
  expected_delivery: string;
  cost_cents: number;
}

export default function ManufacturingPage() {
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<ManufacturingBatch | null>(null);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);

  useEffect(() => {
    fetchBatches();
    fetchRawMaterials();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('manufacturing_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBatches(data);
    }
    setLoading(false);
  };

  const fetchRawMaterials = async () => {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
      .order('name');

    if (!error && data) {
      setRawMaterials(data);
    }
  };

  const handleStatusUpdate = async (batchId: string, newStatus: string) => {
    const { error } = await supabase
      .from('manufacturing_batches')
      .update({ status: newStatus })
      .eq('id', batchId);

    if (!error) {
      fetchBatches();
      setSelectedBatch(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Manufacturing & Inventory</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="card-title">Manufacturing Batches</h2>

            {loading ? (
              <p>Loading...</p>
            ) : batches.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Batch Number</th>
                    <th>Status</th>
                    <th>Quantity</th>
                    <th>Cost</th>
                    <th>Expected Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch)}
                      style={{ cursor: 'pointer' }}
                      className={selectedBatch?.id === batch.id ? 'bg-light' : ''}
                    >
                      <td className="font-mono text-sm">{batch.batch_number}</td>
                      <td>
                        <span className="px-2 py-1 text-xs font-bold rounded bg-light">
                          {batch.status}
                        </span>
                      </td>
                      <td>
                        {batch.quantity_completed}/{batch.quantity_ordered}
                      </td>
                      <td>{formatCentsToUSD(batch.cost_cents)}</td>
                      <td className="text-sm">
                        {batch.expected_delivery
                          ? new Date(batch.expected_delivery).toLocaleDateString()
                          : 'TBD'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No batches yet</p>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Raw Materials Inventory</h2>

            {rawMaterials.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>SKU</th>
                    <th>Available</th>
                    <th>Reserved</th>
                    <th>Reorder Point</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((material) => (
                    <tr key={material.id}>
                      <td className="font-medium">{material.name}</td>
                      <td className="text-sm">{material.sku}</td>
                      <td
                        className={
                          material.quantity_available < material.reorder_point
                            ? 'text-red-600 font-bold'
                            : ''
                        }
                      >
                        {material.quantity_available}
                      </td>
                      <td>{material.quantity_reserved}</td>
                      <td className="text-sm">{material.reorder_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No raw materials tracked yet</p>
            )}
          </div>
        </div>

        {selectedBatch && (
          <div className="card">
            <h2 className="card-title">Batch Details</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Batch Number</p>
                <p className="font-mono font-bold">{selectedBatch.batch_number}</p>
              </div>

              <div>
                <p className="text-gray-600">Status</p>
                <select
                  value={selectedBatch.status}
                  onChange={(e) => handleStatusUpdate(selectedBatch.id, e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="ordered">Ordered</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>

              <div>
                <p className="text-gray-600">Quantity</p>
                <p>
                  {selectedBatch.quantity_completed} /{' '}
                  {selectedBatch.quantity_ordered}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Cost</p>
                <p className="font-bold">
                  {formatCentsToUSD(selectedBatch.cost_cents)}
                </p>
              </div>

              <div>
                <p className="text-gray-600">Expected Delivery</p>
                <p>
                  {selectedBatch.expected_delivery
                    ? new Date(selectedBatch.expected_delivery).toLocaleDateString()
                    : 'TBD'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
