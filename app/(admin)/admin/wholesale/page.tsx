'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { SheetEmbed } from '@/components/admin/SheetEmbed';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/format';
import { useState, useEffect } from 'react';

interface WholesaleAccount {
  id: string;
  business_name: string;
  user_id: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  tier: 'standard' | 'premium';
  tax_id: string | null;
  created_at: string;
}

interface WholesalePricing {
  id: string;
  product_id: string;
  tier: 'standard' | 'premium';
  price_cents: number;
  min_quantity: number;
}

interface ProductOption {
  id: string;
  name: string;
  cost_cents: number;
}

interface PricingForm {
  product_id: string;
  tier: 'standard' | 'premium';
  priceUsd: string;
  min_quantity: number;
}

const EMPTY_PRICING: PricingForm = {
  product_id: '',
  tier: 'standard',
  priceUsd: '',
  min_quantity: 100,
};

export default function WholesalePage() {
  const [accounts, setAccounts] = useState<WholesaleAccount[]>([]);
  const [pricing, setPricing] = useState<WholesalePricing[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<WholesaleAccount | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [pricingForm, setPricingForm] = useState<PricingForm>(EMPTY_PRICING);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [acctRes, priceRes, prodRes] = await Promise.all([
      supabase
        .from('wholesale_accounts')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('wholesale_pricing')
        .select('*')
        .order('tier', { ascending: true }),
      supabase.from('products').select('id, name, cost_cents').order('name'),
    ]);
    setAccounts(acctRes.data ?? []);
    setPricing(priceRes.data ?? []);
    setProducts(prodRes.data ?? []);
    setLoading(false);
  };

  const updateAccount = async (
    id: string,
    body: Record<string, unknown>
  ) => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/wholesale-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Save failed');
      await refresh();
      // Refresh selected to reflect change.
      setSelectedAccount((prev) =>
        prev && prev.id === id ? { ...prev, ...body } as WholesaleAccount : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = (account: WholesaleAccount, tier: WholesaleAccount['tier']) =>
    updateAccount(account.id, { approval_status: 'approved', tier });

  const handleReject = (account: WholesaleAccount) =>
    updateAccount(account.id, { approval_status: 'rejected' });

  const handleCreatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(pricingForm.priceUsd) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Price must be a positive number');
      return;
    }
    if (!pricingForm.product_id) {
      setError('Pick a product');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/wholesale-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: pricingForm.product_id,
          tier: pricingForm.tier,
          price_cents: cents,
          min_quantity: pricingForm.min_quantity,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Save failed');
      setPricingForm(EMPTY_PRICING);
      setShowPricingForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePricing = async (id: string) => {
    if (!confirm('Delete this pricing tier?')) return;
    setError('');
    try {
      const response = await fetch(`/api/admin/wholesale-pricing/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? 'Delete failed');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name ?? id.slice(0, 8);
  const productCost = (id: string) =>
    products.find((p) => p.id === id)?.cost_cents ?? 0;

  // Material-only margin %. Anything below 25% is a yellow flag because
  // we still haven't subtracted overhead / labor / shipping from this
  // ratio — at DIY scale (~50/mo) overhead alone adds another ~$3/unit.
  const marginPct = (priceCents: number, costCents: number) => {
    if (!priceCents || !costCents) return null;
    return ((priceCents - costCents) / priceCents) * 100;
  };
  const marginColor = (pct: number | null) => {
    if (pct === null) return 'var(--admin-text-muted)';
    if (pct < 25) return 'var(--c-magenta)';
    if (pct < 40) return 'var(--c-sodium)';
    return 'var(--c-lime)';
  };

  // Live preview of cost + margin while the admin is filling in the form.
  const previewCostCents = pricingForm.product_id
    ? productCost(pricingForm.product_id)
    : 0;
  const previewPriceCents =
    Number.isFinite(parseFloat(pricingForm.priceUsd))
      ? Math.round(parseFloat(pricingForm.priceUsd) * 100)
      : 0;
  const previewMargin = marginPct(previewPriceCents, previewCostCents);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Wholesale</h1>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="card-title">Applications & Accounts</h2>
            {loading ? (
              <p>Loading...</p>
            ) : accounts.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Status</th>
                    <th>Tier</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      onClick={() => setSelectedAccount(account)}
                      style={{ cursor: 'pointer' }}
                      className={
                        selectedAccount?.id === account.id ? 'bg-light' : ''
                      }
                    >
                      <td className="font-medium">{account.business_name}</td>
                      <td>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            account.approval_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : account.approval_status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {account.approval_status}
                        </span>
                      </td>
                      <td className="capitalize">{account.tier}</td>
                      <td className="text-sm">
                        {new Date(account.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No wholesale accounts yet</p>
            )}
          </div>
        </div>

        {selectedAccount && (
          <div className="card">
            <h2 className="card-title">Account Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Business</p>
                <p className="font-bold">{selectedAccount.business_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-bold capitalize">
                  {selectedAccount.approval_status}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Tier</p>
                <select
                  value={selectedAccount.tier}
                  onChange={(e) =>
                    updateAccount(selectedAccount.id, {
                      tier: e.target.value,
                    })
                  }
                  className="form-select text-sm"
                  disabled={submitting}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              {selectedAccount.tax_id && (
                <div>
                  <p className="text-gray-600">Tax ID</p>
                  <p className="font-mono text-xs">{selectedAccount.tax_id}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Applied</p>
                <p className="text-xs">
                  {new Date(selectedAccount.created_at).toLocaleString()}
                </p>
              </div>

              {selectedAccount.approval_status === 'pending' && (
                <div className="flex flex-col gap-2 pt-4">
                  <button
                    onClick={() =>
                      handleApprove(selectedAccount, selectedAccount.tier)
                    }
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    Approve as {selectedAccount.tier}
                  </button>
                  <button
                    onClick={() => handleReject(selectedAccount)}
                    className="btn"
                    style={{ background: '#dc2626', color: 'white' }}
                    disabled={submitting}
                  >
                    Reject
                  </button>
                </div>
              )}
              {selectedAccount.approval_status !== 'pending' && (
                <button
                  onClick={() =>
                    updateAccount(selectedAccount.id, {
                      approval_status: 'pending',
                    })
                  }
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Move back to pending
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Wholesale Pricing</h2>
          {!showPricingForm && (
            <button
              onClick={() => {
                setShowPricingForm(true);
                setPricingForm(EMPTY_PRICING);
              }}
              className="btn btn-primary"
            >
              + Add tier
            </button>
          )}
        </div>

        {showPricingForm && (
          <form onSubmit={handleCreatePricing} className="card mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="form-label">Product *</label>
                <select
                  value={pricingForm.product_id}
                  onChange={(e) =>
                    setPricingForm({
                      ...pricingForm,
                      product_id: e.target.value,
                    })
                  }
                  className="form-select"
                  required
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
                <label className="form-label">Tier *</label>
                <select
                  value={pricingForm.tier}
                  onChange={(e) =>
                    setPricingForm({
                      ...pricingForm,
                      tier: e.target.value as 'standard' | 'premium',
                    })
                  }
                  className="form-select"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Min quantity *</label>
                <input
                  type="number"
                  min={1}
                  value={pricingForm.min_quantity}
                  onChange={(e) =>
                    setPricingForm({
                      ...pricingForm,
                      min_quantity: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price per unit (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricingForm.priceUsd}
                  onChange={(e) =>
                    setPricingForm({
                      ...pricingForm,
                      priceUsd: e.target.value,
                    })
                  }
                  className="form-input"
                  required
                />
              </div>
            </div>
            {pricingForm.product_id && (
              <div
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'baseline',
                  padding: '0.6rem 0.85rem',
                  marginBottom: '0.75rem',
                  borderRadius: 8,
                  background: 'rgba(0, 240, 255, 0.06)',
                  border: '1px solid rgba(0, 240, 255, 0.18)',
                  fontSize: '0.85rem',
                }}
              >
                <span>
                  <span style={{ color: 'var(--admin-text-muted)' }}>
                    Cost/unit:&nbsp;
                  </span>
                  <strong>
                    {previewCostCents
                      ? formatCentsToUSD(previewCostCents)
                      : '— (not set)'}
                  </strong>
                </span>
                {previewCostCents > 0 && previewPriceCents > 0 && (
                  <>
                    <span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        Margin:&nbsp;
                      </span>
                      <strong style={{ color: marginColor(previewMargin) }}>
                        {formatCentsToUSD(
                          previewPriceCents - previewCostCents
                        )}{' '}
                        ·{' '}
                        {previewMargin === null
                          ? '—'
                          : `${previewMargin.toFixed(1)}%`}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save tier'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPricingForm(false);
                  setPricingForm(EMPTY_PRICING);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {pricing.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Tier</th>
                <th>Min qty</th>
                <th>Cost/unit</th>
                <th>Price/unit</th>
                <th>Margin %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((row) => {
                const cost = productCost(row.product_id);
                const pct = marginPct(row.price_cents, cost);
                return (
                  <tr key={row.id}>
                    <td className="font-medium">{productName(row.product_id)}</td>
                    <td className="capitalize">{row.tier}</td>
                    <td>{row.min_quantity}</td>
                    <td>{cost ? formatCentsToUSD(cost) : '—'}</td>
                    <td>{formatCentsToUSD(row.price_cents)}</td>
                    <td style={{ color: marginColor(pct), fontWeight: 600 }}>
                      {pct === null ? '—' : `${pct.toFixed(1)}%`}
                    </td>
                    <td className="text-sm">
                      <button
                        onClick={() => handleDeletePricing(row.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No tiered pricing yet</p>
        )}
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted)',
            marginTop: '0.75rem',
            lineHeight: 1.5,
          }}
        >
          Cost is material-only, sourced from the Wholesale Costing &amp;
          Margin Workbook (DIY active tier, Amazon/bulk-anchored placeholders).
          Overhead, labor, and shipping are <em>not</em> included — at DIY
          scale (~50&nbsp;units/mo) overhead alone adds roughly $3/unit, which
          would wipe out the magenta and sodium rows below.
        </p>
      </div>

      <SheetEmbed
        slug="wholesale"
        defaultLabel="Wholesale · pipeline tracker"
        hint="account pipeline, expected volume, and outreach notes that supabase doesn't store."
      />
    </AdminLayout>
  );
}
