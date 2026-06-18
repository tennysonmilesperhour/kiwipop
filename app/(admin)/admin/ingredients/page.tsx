'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { formatCentsToUSD } from '@/lib/format';

interface Material {
  id: string;
  name: string;
  sku: string;
  unit: string;
  quantity_available: number;
  reorder_point: number;
  cost_per_unit_cents: number | null;
  reference_url: string | null;
  pack_weight: number | null;
  pack_price_cents: number | null;
  wholesale_url: string | null;
  wholesale_pack_weight: number | null;
  wholesale_pack_price_cents: number | null;
}

interface BreakdownLine {
  materialId: string;
  name: string;
  sku: string;
  unit: string;
  perPop: number;
  stock: number;
  supported: number;
}

interface Flavor {
  product_id: string;
  sku: string;
  name: string;
  producible: number;
  low: boolean;
  breakdown: BreakdownLine[];
}

interface IngredientsResponse {
  materials: Material[];
  flavors: Flavor[];
  threshold: number;
}

interface EditForm {
  unit: string;
  reorderPoint: string;
  referenceUrl: string;
  packWeight: string;
  packPriceUsd: string;
  wholesaleUrl: string;
  wholesalePackWeight: string;
  wholesalePackPriceUsd: string;
}

const num = (s: string): number | null => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

export default function IngredientsPage() {
  const [data, setData] = useState<IngredientsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);
  const [manualQty, setManualQty] = useState('');
  const [manualCost, setManualCost] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [openFlavor, setOpenFlavor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ingredients');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Load failed');
      setData(json as IngredientsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const restock = async (
    id: string,
    payload: { source: 'retail' | 'wholesale' | 'manual'; quantityAdded?: number; costCents?: number }
  ) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/raw-materials/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Restock failed');
      setManualId(null);
      setManualQty('');
      setManualCost('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restock failed');
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (m: Material) => {
    setEditId(m.id);
    setEditForm({
      unit: m.unit ?? 'g',
      reorderPoint: String(m.reorder_point ?? 0),
      referenceUrl: m.reference_url ?? '',
      packWeight: m.pack_weight != null ? String(m.pack_weight) : '',
      packPriceUsd: m.pack_price_cents != null ? (m.pack_price_cents / 100).toFixed(2) : '',
      wholesaleUrl: m.wholesale_url ?? '',
      wholesalePackWeight: m.wholesale_pack_weight != null ? String(m.wholesale_pack_weight) : '',
      wholesalePackPriceUsd:
        m.wholesale_pack_price_cents != null ? (m.wholesale_pack_price_cents / 100).toFixed(2) : '',
    });
  };

  const saveEdit = async () => {
    if (!editId || !editForm) return;
    setBusyId(editId);
    setError('');
    try {
      const body: Record<string, unknown> = {
        unit: editForm.unit,
        reorder_point: num(editForm.reorderPoint) ?? 0,
        reference_url: editForm.referenceUrl.trim() || null,
        pack_weight: num(editForm.packWeight),
        pack_price_cents:
          num(editForm.packPriceUsd) != null ? Math.round(num(editForm.packPriceUsd)! * 100) : null,
        wholesale_url: editForm.wholesaleUrl.trim() || null,
        wholesale_pack_weight: num(editForm.wholesalePackWeight),
        wholesale_pack_price_cents:
          num(editForm.wholesalePackPriceUsd) != null
            ? Math.round(num(editForm.wholesalePackPriceUsd)! * 100)
            : null,
      };
      const res = await fetch(`/api/admin/raw-materials/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      setEditId(null);
      setEditForm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ingredients</h1>
        <button onClick={() => void load()} className="btn">
          ↻ Refresh
        </button>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Producible per flavor */}
      <div className="card mb-6">
        <h2 className="card-title">
          Producible pops per flavor{' '}
          <span className="text-sm text-gray-600">
            (alert below {data?.threshold ?? 50})
          </span>
        </h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Click a flavor to see which ingredient is the bottleneck.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {(data?.flavors ?? []).map((f) => {
                const open = openFlavor === f.product_id;
                const accent = f.low ? 'var(--c-magenta)' : 'var(--c-lime)';
                return (
                  <button
                    key={f.product_id}
                    type="button"
                    onClick={() => setOpenFlavor(open ? null : f.product_id)}
                    style={{
                      border: `1px solid ${accent}`,
                      borderRadius: 10,
                      padding: '1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: open ? 'var(--admin-accent-tint)' : 'transparent',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{f.name}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>
                      {f.producible}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      {f.low ? '⚠ low stock' : 'pops'} · {open ? 'hide ▲' : 'breakdown ▾'}
                    </div>
                  </button>
                );
              })}
            </div>

            {openFlavor &&
              (() => {
                const f = data?.flavors.find((x) => x.product_id === openFlavor);
                if (!f) return null;
                const limiting = f.breakdown[0]?.supported;
                return (
                  <div
                    style={{
                      marginTop: '1rem',
                      border: '1px solid var(--admin-border-strong)',
                      borderRadius: 10,
                      padding: '1rem',
                    }}
                  >
                    <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                      {f.name} — ingredient breakdown
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Each ingredient can support this many pops at current stock. The
                      smallest number (highlighted) is what caps this flavor at{' '}
                      <strong>{f.producible}</strong>.
                    </p>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Ingredient</th>
                          <th>In stock</th>
                          <th>Per pop</th>
                          <th>Supports</th>
                        </tr>
                      </thead>
                      <tbody>
                        {f.breakdown.map((b) => {
                          const isLimiting = b.supported === limiting;
                          return (
                            <tr key={b.materialId}>
                              <td className={isLimiting ? 'font-bold' : ''}>
                                {b.name}
                                {isLimiting ? (
                                  <span style={{ color: 'var(--c-magenta)' }}> · bottleneck</span>
                                ) : null}
                              </td>
                              <td>
                                {b.stock.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                                {b.unit}
                              </td>
                              <td>
                                {b.perPop} {b.unit}
                              </td>
                              <td
                                style={{
                                  fontWeight: 700,
                                  color: isLimiting ? 'var(--c-magenta)' : 'var(--c-lime)',
                                }}
                              >
                                {b.supported.toLocaleString()} pops
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
          </>
        )}
      </div>

      {/* Raw materials */}
      <div className="card">
        <h2 className="card-title">Raw materials</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>In stock</th>
                <th>Reorder at</th>
                <th>Cost / unit</th>
                <th>Restock</th>
              </tr>
            </thead>
            <tbody>
              {(data?.materials ?? []).map((m) => {
                const low = m.quantity_available < m.reorder_point;
                const hasRetail = m.pack_weight != null && m.pack_weight > 0;
                const hasWholesale = m.wholesale_pack_weight != null && m.wholesale_pack_weight > 0;
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-600">{m.sku}</div>
                      {(m.reference_url || m.wholesale_url) && (
                        <div className="text-xs" style={{ marginTop: 2 }}>
                          {m.reference_url && (
                            <a href={m.reference_url} target="_blank" rel="noreferrer" style={{ color: 'var(--c-cyan)' }}>
                              retail link
                            </a>
                          )}
                          {m.reference_url && m.wholesale_url && ' · '}
                          {m.wholesale_url && (
                            <a href={m.wholesale_url} target="_blank" rel="noreferrer" style={{ color: 'var(--c-cyan)' }}>
                              wholesale link
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={low ? 'text-red-600 font-bold' : ''}>
                      {Number(m.quantity_available).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      {m.unit}
                    </td>
                    <td className="text-sm">
                      {Number(m.reorder_point).toLocaleString()} {m.unit}
                    </td>
                    <td className="text-sm">
                      {m.cost_per_unit_cents != null
                        ? `${formatCentsToUSD(Math.round(Number(m.cost_per_unit_cents)))}/${m.unit}`
                        : '—'}
                    </td>
                    <td>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        <button
                          className="btn"
                          disabled={!hasRetail || busyId === m.id}
                          title={
                            hasRetail
                              ? `+${m.pack_weight}${m.unit}${
                                  m.pack_price_cents ? ` @ ${formatCentsToUSD(m.pack_price_cents)}` : ''
                                }`
                              : 'No retail pack preset — set one with Edit'
                          }
                          onClick={() => restock(m.id, { source: 'retail' })}
                        >
                          + Retail pack
                        </button>
                        <button
                          className="btn"
                          disabled={!hasWholesale || busyId === m.id}
                          title={
                            hasWholesale
                              ? `+${m.wholesale_pack_weight}${m.unit}${
                                  m.wholesale_pack_price_cents
                                    ? ` @ ${formatCentsToUSD(m.wholesale_pack_price_cents)}`
                                    : ''
                                }`
                              : 'No wholesale pack preset — set one with Edit'
                          }
                          onClick={() => restock(m.id, { source: 'wholesale' })}
                        >
                          + Wholesale pack
                        </button>
                        <button
                          className="btn"
                          onClick={() => {
                            setManualId(manualId === m.id ? null : m.id);
                            setManualQty('');
                            setManualCost('');
                          }}
                        >
                          Manual…
                        </button>
                        <button className="btn btn-secondary" onClick={() => openEdit(m)}>
                          Edit
                        </button>
                      </div>

                      {manualId === m.id && (
                        <div className="flex gap-2 items-end" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <div>
                            <label className="form-label text-xs">Add ({m.unit})</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-input w-24"
                              value={manualQty}
                              onChange={(e) => setManualQty(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label text-xs">Cost (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-input w-24"
                              value={manualCost}
                              onChange={(e) => setManualCost(e.target.value)}
                            />
                          </div>
                          <button
                            className="btn btn-primary"
                            disabled={busyId === m.id}
                            onClick={() => {
                              const q = num(manualQty);
                              if (q == null || q <= 0) {
                                setError('Enter a positive quantity');
                                return;
                              }
                              const c = num(manualCost);
                              restock(m.id, {
                                source: 'manual',
                                quantityAdded: q,
                                costCents: c != null ? Math.round(c * 100) : undefined,
                              });
                            }}
                          >
                            {busyId === m.id ? 'Adding…' : 'Add'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit presets drawer */}
      {editId && editForm && (
        <div className="card mt-6" style={{ borderColor: 'var(--c-cyan)' }}>
          <h2 className="card-title">Edit material — presets & links</h2>
          <p className="text-sm text-gray-600 mb-3">
            Save a reference link plus a remembered pack weight & price so the “+ Retail pack” /
            “+ Wholesale pack” buttons add the right quantity and log the cost in one click.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Base unit</label>
              <select
                className="form-select"
                value={editForm.unit}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
              >
                {['g', 'kg', 'ml', 'l', 'ea'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reorder point ({editForm.unit})</label>
              <input
                type="number"
                className="form-input"
                value={editForm.reorderPoint}
                onChange={(e) => setEditForm({ ...editForm, reorderPoint: e.target.value })}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Retail reference link (Amazon, etc.)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://amazon.com/..."
                value={editForm.referenceUrl}
                onChange={(e) => setEditForm({ ...editForm, referenceUrl: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Retail pack weight ({editForm.unit})</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={editForm.packWeight}
                onChange={(e) => setEditForm({ ...editForm, packWeight: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Retail pack price (USD)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={editForm.packPriceUsd}
                onChange={(e) => setEditForm({ ...editForm, packPriceUsd: e.target.value })}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Wholesale reference link</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={editForm.wholesaleUrl}
                onChange={(e) => setEditForm({ ...editForm, wholesaleUrl: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wholesale pack weight ({editForm.unit})</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={editForm.wholesalePackWeight}
                onChange={(e) => setEditForm({ ...editForm, wholesalePackWeight: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wholesale pack price (USD)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={editForm.wholesalePackPriceUsd}
                onChange={(e) =>
                  setEditForm({ ...editForm, wholesalePackPriceUsd: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busyId === editId} onClick={saveEdit}>
              {busyId === editId ? 'Saving…' : 'Save'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditId(null);
                setEditForm(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
