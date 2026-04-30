'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { formatCentsToUSD } from '@/lib/format';

interface ManufacturingBatch {
  id: string;
  batch_number: string;
  product_id: string;
  quantity_ordered: number;
  quantity_completed: number;
  status: string;
  expected_delivery: string | null;
  cost_cents: number;
  notes: string | null;
}

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  quantity_available: number;
  quantity_reserved: number;
  reorder_point: number;
  supplier_id: string | null;
}

interface Supplier {
  id: string;
  name: string;
  contact_email: string | null;
  supplier_type: 'manufacturer' | 'raw_material';
  lead_time_days: number | null;
}

interface ProductOption {
  id: string;
  name: string;
}

type Drawer = 'none' | 'batch' | 'material' | 'supplier';

interface BatchForm {
  batch_number: string;
  product_id: string;
  quantity_ordered: number;
  supplier_id: string;
  status: 'draft' | 'ordered' | 'in_progress' | 'completed' | 'shipped';
  expected_delivery: string;
  costUsd: string;
  notes: string;
}

const EMPTY_BATCH: BatchForm = {
  batch_number: '',
  product_id: '',
  quantity_ordered: 1000,
  supplier_id: '',
  status: 'draft',
  expected_delivery: '',
  costUsd: '',
  notes: '',
};

interface MaterialForm {
  name: string;
  sku: string;
  quantity_available: number;
  reorder_point: number;
  supplier_id: string;
}

const EMPTY_MATERIAL: MaterialForm = {
  name: '',
  sku: '',
  quantity_available: 0,
  reorder_point: 0,
  supplier_id: '',
};

interface SupplierForm {
  name: string;
  contact_email: string;
  supplier_type: 'manufacturer' | 'raw_material';
  lead_time_days: number;
}

const EMPTY_SUPPLIER: SupplierForm = {
  name: '',
  contact_email: '',
  supplier_type: 'manufacturer',
  lead_time_days: 14,
};

export default function ManufacturingPage() {
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<ManufacturingBatch | null>(null);
  const [drawer, setDrawer] = useState<Drawer>('none');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [batchForm, setBatchForm] = useState<BatchForm>(EMPTY_BATCH);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(EMPTY_MATERIAL);
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(EMPTY_SUPPLIER);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [batchRes, rawRes, supRes, prodRes] = await Promise.all([
      supabase
        .from('manufacturing_batches')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('raw_materials').select('*').order('name'),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('products').select('id, name').order('name'),
    ]);
    setBatches(batchRes.data ?? []);
    setRawMaterials(rawRes.data ?? []);
    setSuppliers(supRes.data ?? []);
    setProducts(prodRes.data ?? []);
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

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = batchForm.costUsd
      ? Math.round(parseFloat(batchForm.costUsd) * 100)
      : 0;
    if (!batchForm.product_id) {
      setError('Pick a product for this batch');
      return;
    }
    try {
      await submit('/api/admin/manufacturing/batches', 'POST', {
        batch_number: batchForm.batch_number.trim(),
        product_id: batchForm.product_id,
        quantity_ordered: batchForm.quantity_ordered,
        supplier_id: batchForm.supplier_id || null,
        status: batchForm.status,
        expected_delivery: batchForm.expected_delivery
          ? new Date(batchForm.expected_delivery).toISOString()
          : null,
        cost_cents: cost,
        notes: batchForm.notes.trim() || undefined,
      });
      setBatchForm(EMPTY_BATCH);
      setDrawer('none');
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const handleStatusUpdate = async (batchId: string, newStatus: string) => {
    try {
      await submit(`/api/admin/manufacturing/batches/${batchId}`, 'PATCH', {
        status: newStatus,
      });
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const handleCompletedQty = async (batch: ManufacturingBatch, qty: number) => {
    try {
      await submit(`/api/admin/manufacturing/batches/${batch.id}`, 'PATCH', {
        quantity_completed: qty,
      });
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit('/api/admin/raw-materials', 'POST', {
        name: materialForm.name.trim(),
        sku: materialForm.sku.trim(),
        quantity_available: materialForm.quantity_available,
        reorder_point: materialForm.reorder_point,
        supplier_id: materialForm.supplier_id || null,
      });
      setMaterialForm(EMPTY_MATERIAL);
      setDrawer('none');
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit('/api/admin/suppliers', 'POST', {
        name: supplierForm.name.trim(),
        contact_email: supplierForm.contact_email.trim() || undefined,
        supplier_type: supplierForm.supplier_type,
        lead_time_days: supplierForm.lead_time_days,
      });
      setSupplierForm(EMPTY_SUPPLIER);
      setDrawer('none');
      await refresh();
    } catch {
      /* error displayed */
    }
  };

  const supplierName = (id: string | null) => {
    if (!id) return '—';
    return suppliers.find((s) => s.id === id)?.name ?? '—';
  };

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manufacturing & Inventory</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setDrawer('batch');
              setBatchForm(EMPTY_BATCH);
            }}
            className="btn btn-primary"
          >
            + New Batch
          </button>
          <button
            onClick={() => {
              setDrawer('material');
              setMaterialForm(EMPTY_MATERIAL);
            }}
            className="btn"
          >
            + Raw Material
          </button>
          <button
            onClick={() => {
              setDrawer('supplier');
              setSupplierForm(EMPTY_SUPPLIER);
            }}
            className="btn"
          >
            + Supplier
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {drawer === 'batch' && (
        <div className="card mb-6">
          <h2 className="card-title">New Manufacturing Batch</h2>
          <form onSubmit={handleCreateBatch}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Batch number *</label>
                <input
                  type="text"
                  value={batchForm.batch_number}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, batch_number: e.target.value })
                  }
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select
                  value={batchForm.product_id}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, product_id: e.target.value })
                  }
                  required
                  className="form-select"
                >
                  <option value="">— select —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity ordered *</label>
                <input
                  type="number"
                  min={1}
                  value={batchForm.quantity_ordered}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      quantity_ordered: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select
                  value={batchForm.supplier_id}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, supplier_id: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="">— none —</option>
                  {suppliers
                    .filter((s) => s.supplier_type === 'manufacturer')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={batchForm.status}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      status: e.target.value as BatchForm['status'],
                    })
                  }
                  className="form-select"
                >
                  <option value="draft">Draft</option>
                  <option value="ordered">Ordered</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Expected delivery</label>
                <input
                  type="date"
                  value={batchForm.expected_delivery}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      expected_delivery: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total cost (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={batchForm.costUsd}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, costUsd: e.target.value })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Notes</label>
                <textarea
                  value={batchForm.notes}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, notes: e.target.value })
                  }
                  rows={2}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Create batch'}
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

      {drawer === 'material' && (
        <div className="card mb-6">
          <h2 className="card-title">New Raw Material</h2>
          <form onSubmit={handleCreateMaterial}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, name: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  value={materialForm.sku}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, sku: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity available</label>
                <input
                  type="number"
                  min={0}
                  value={materialForm.quantity_available}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      quantity_available: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder point</label>
                <input
                  type="number"
                  min={0}
                  value={materialForm.reorder_point}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      reorder_point: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Supplier</label>
                <select
                  value={materialForm.supplier_id}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      supplier_id: e.target.value,
                    })
                  }
                  className="form-select"
                >
                  <option value="">— none —</option>
                  {suppliers
                    .filter((s) => s.supplier_type === 'raw_material')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save material'}
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

      {drawer === 'supplier' && (
        <div className="card mb-6">
          <h2 className="card-title">New Supplier</h2>
          <form onSubmit={handleCreateSupplier}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, name: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select
                  value={supplierForm.supplier_type}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      supplier_type: e.target
                        .value as SupplierForm['supplier_type'],
                    })
                  }
                  className="form-select"
                >
                  <option value="manufacturer">Manufacturer</option>
                  <option value="raw_material">Raw material</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact email</label>
                <input
                  type="email"
                  value={supplierForm.contact_email}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      contact_email: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lead time (days)</label>
                <input
                  type="number"
                  min={0}
                  value={supplierForm.lead_time_days}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      lead_time_days: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save supplier'}
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
            <h2 className="card-title">Manufacturing Batches</h2>
            {loading ? (
              <p>Loading...</p>
            ) : batches.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Expected</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch)}
                      style={{ cursor: 'pointer' }}
                      className={
                        selectedBatch?.id === batch.id ? 'bg-light' : ''
                      }
                    >
                      <td className="font-mono text-sm">{batch.batch_number}</td>
                      <td className="text-sm">{productName(batch.product_id)}</td>
                      <td>
                        <span className="px-2 py-1 text-xs font-bold rounded bg-light">
                          {batch.status}
                        </span>
                      </td>
                      <td>
                        {batch.quantity_completed}/{batch.quantity_ordered}
                      </td>
                      <td>{formatCentsToUSD(batch.cost_cents ?? 0)}</td>
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
            <h2 className="card-title">Raw Materials</h2>
            {rawMaterials.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>SKU</th>
                    <th>Available</th>
                    <th>Reserved</th>
                    <th>Reorder at</th>
                    <th>Supplier</th>
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
                      <td className="text-sm">
                        {supplierName(material.supplier_id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No raw materials tracked yet</p>
            )}
          </div>

          <div className="card mt-6">
            <h2 className="card-title">Suppliers</h2>
            {suppliers.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Email</th>
                    <th>Lead time</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium">{s.name}</td>
                      <td className="capitalize text-sm">
                        {s.supplier_type.replace('_', ' ')}
                      </td>
                      <td className="text-sm">{s.contact_email ?? '—'}</td>
                      <td className="text-sm">
                        {s.lead_time_days != null
                          ? `${s.lead_time_days} d`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No suppliers yet</p>
            )}
          </div>
        </div>

        {selectedBatch && (
          <div className="card">
            <h2 className="card-title">Batch Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Batch number</p>
                <p className="font-mono font-bold">
                  {selectedBatch.batch_number}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Product</p>
                <p>{productName(selectedBatch.product_id)}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <select
                  value={selectedBatch.status}
                  onChange={(e) =>
                    handleStatusUpdate(selectedBatch.id, e.target.value)
                  }
                  className="form-select text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="ordered">Ordered</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>
              <div>
                <p className="text-gray-600">Completed</p>
                <input
                  type="number"
                  min={0}
                  max={selectedBatch.quantity_ordered}
                  defaultValue={selectedBatch.quantity_completed}
                  onBlur={(e) => {
                    const qty = parseInt(e.target.value, 10);
                    if (
                      Number.isFinite(qty) &&
                      qty !== selectedBatch.quantity_completed
                    ) {
                      handleCompletedQty(selectedBatch, qty);
                    }
                  }}
                  className="form-input"
                />
                <p className="text-xs text-gray-600 mt-1">
                  of {selectedBatch.quantity_ordered}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Cost</p>
                <p className="font-bold">
                  {formatCentsToUSD(selectedBatch.cost_cents ?? 0)}
                </p>
              </div>
              {selectedBatch.notes && (
                <div>
                  <p className="text-gray-600">Notes</p>
                  <p className="text-xs whitespace-pre-wrap">
                    {selectedBatch.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
