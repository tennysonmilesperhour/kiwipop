'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { SheetEmbed } from '@/components/admin/SheetEmbed';
import { WholesaleLineSheetCard } from '@/components/admin/WholesaleLineSheetCard';
import { PlanBanner } from '@/components/admin/PlanBanner';
import { DoorPipeline } from '@/components/admin/DoorPipeline';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/format';
import {
  TIER_META,
  WHOLESALE_TIERS,
  tierLabel,
  type WholesaleTier,
} from '@/lib/wholesale-tiers';
import { useState, useEffect } from 'react';

interface WholesaleAccount {
  id: string;
  business_name: string;
  user_id: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  tier: WholesaleTier;
  tax_id: string | null;
  created_at: string;
}

interface WholesalePricing {
  id: string;
  product_id: string;
  tier: WholesaleTier;
  price_cents: number;
  min_quantity: number;
}

interface WholesaleCode {
  id: string;
  wholesale_account_id: string;
  code: string;
  percent_off: number;
  kind: 'first_order' | 'referral';
  redeemed_at: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  cost_cents: number;
}

type CostBasis =
  | 'diy_tier1'
  | 'diy_tier2'
  | 'diy_tier3'
  | 'copacker'
  | 'inhouse';

interface AppSettings {
  monthly_overhead_cents: number;
  target_monthly_volume: number;
  active_cost_basis: CostBasis;
}

const BASIS_LABELS: Record<CostBasis, string> = {
  diy_tier1: 'DIY · small bulk',
  diy_tier2: 'DIY · Amazon-anchored',
  diy_tier3: 'DIY · large bulk',
  copacker: 'Copacker',
  inhouse: 'In-house · staffed',
};
const BASIS_HINTS: Record<CostBasis, string> = {
  diy_tier1: 'Small-bulk ingredient prices — what 1-flavor batches cost on craft suppliers / Amazon small packs.',
  diy_tier2: 'Next pouch/lot size up on the same Amazon listings — achievable today, ~25% cheaper than Tier 1.',
  diy_tier3: 'Large-bulk lots (4500–10000g pouches, 10000-count packaging) — real inventory commitment, ~25% cheaper than Tier 2.',
  copacker: 'External manufacturer at ~$0.75/pop including labor + packaging — viable above ~1000/mo, frees up the founders. Unquoted estimate; carries a 500–1000 lb minimum run.',
  inhouse: 'Tier-2 materials plus ~$0.45/pop of paid staff and commissary rent — a 3-person line at $22.50/hr loaded. No minimum run, no lead time. See lib/production-cost.ts.',
};

interface PricingForm {
  product_id: string;
  tier: WholesaleTier;
  priceUsd: string;
  min_quantity: number;
}

const EMPTY_PRICING: PricingForm = {
  product_id: '',
  tier: 'standard' as WholesaleTier,
  priceUsd: '',
  min_quantity: 100,
};

const DEFAULT_SETTINGS: AppSettings = {
  monthly_overhead_cents: 15000,
  target_monthly_volume: 100,
  active_cost_basis: 'diy_tier2',
};

export default function WholesalePage() {
  const [accounts, setAccounts] = useState<WholesaleAccount[]>([]);
  const [codesByAccount, setCodesByAccount] = useState<
    Record<string, WholesaleCode[]>
  >({});
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [pricing, setPricing] = useState<WholesalePricing[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [overheadUsdInput, setOverheadUsdInput] = useState('150');
  const [volumeInput, setVolumeInput] = useState('100');
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<WholesaleAccount | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [savingBasis, setSavingBasis] = useState<CostBasis | null>(null);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [pricingForm, setPricingForm] = useState<PricingForm>(EMPTY_PRICING);
  const [editingCostFor, setEditingCostFor] = useState<string | null>(null);
  const [editingCostUsd, setEditingCostUsd] = useState('');

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [acctRes, codesRes, priceRes, prodRes, settingsRes] =
      await Promise.all([
        supabase
          .from('wholesale_accounts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('wholesale_discount_codes')
          .select('id, wholesale_account_id, code, percent_off, kind, redeemed_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('wholesale_pricing')
          .select('*')
          .order('tier', { ascending: true }),
        supabase.from('products').select('id, name, cost_cents').order('name'),
        fetch('/api/admin/settings').then((r) => (r.ok ? r.json() : null)),
      ]);
    setAccounts(acctRes.data ?? []);
    const grouped: Record<string, WholesaleCode[]> = {};
    for (const row of (codesRes.data ?? []) as WholesaleCode[]) {
      (grouped[row.wholesale_account_id] ??= []).push(row);
    }
    setCodesByAccount(grouped);
    setPricing(priceRes.data ?? []);
    setProducts(prodRes.data ?? []);
    if (settingsRes) {
      setSettings(settingsRes);
      setOverheadUsdInput((settingsRes.monthly_overhead_cents / 100).toFixed(2));
      setVolumeInput(String(settingsRes.target_monthly_volume));
    }
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

  const handleGenerateCodes = async (account: WholesaleAccount) => {
    setGeneratingCodes(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/wholesale-accounts/${account.id}/codes`,
        { method: 'POST' }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Could not issue codes');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not issue codes');
    } finally {
      setGeneratingCodes(false);
    }
  };

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

  // Overhead amortized into a per-unit cents number at the admin's chosen
  // assumed monthly volume. Floor at 1 unit to avoid division by zero
  // even though the DB CHECK constraint already prevents it.
  const overheadPerUnitCents = Math.round(
    settings.monthly_overhead_cents /
      Math.max(1, settings.target_monthly_volume)
  );

  // Net margin % = (price - material - overhead/unit) / price. This is
  // what gets color-coded, since material-only margin paints a falsely
  // rosy picture at our current DIY scale.
  const netMarginPct = (priceCents: number, costCents: number) => {
    if (!priceCents) return null;
    return ((priceCents - costCents - overheadPerUnitCents) / priceCents) * 100;
  };
  // Material-only margin is also surfaced (smaller) so admin can see
  // how much of the gap is fixed overhead vs. actual COGS.
  const materialMarginPct = (priceCents: number, costCents: number) => {
    if (!priceCents || !costCents) return null;
    return ((priceCents - costCents) / priceCents) * 100;
  };
  const marginColor = (pct: number | null) => {
    if (pct === null) return 'var(--admin-text-muted)';
    if (pct < 0) return 'var(--c-cherry)';
    if (pct < 15) return 'var(--c-magenta)';
    if (pct < 30) return 'var(--c-sodium)';
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
  const previewNetMargin = netMarginPct(previewPriceCents, previewCostCents);
  const previewMaterialMargin = materialMarginPct(
    previewPriceCents,
    previewCostCents
  );

  const saveSettings = async (patch: Partial<AppSettings>) => {
    setError('');
    if (patch.active_cost_basis) setSavingBasis(patch.active_cost_basis);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          json.error
            ? `${json.error}${json.details ? ` — ${json.details}` : ''}`
            : `Save failed (HTTP ${response.status})`
        );
      }
      setSettings(json);
      // Switching cost basis fires a server-side trigger that re-mirrors
      // products.cost_cents from cost_basis_cents[new basis]. Re-fetch
      // products so the table shows the new costs.
      if (patch.active_cost_basis) {
        const prodRes = await supabase
          .from('products')
          .select('id, name, cost_cents')
          .order('name');
        setProducts(prodRes.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingBasis(null);
    }
  };

  const commitOverhead = () => {
    const cents = Math.round(parseFloat(overheadUsdInput) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setOverheadUsdInput((settings.monthly_overhead_cents / 100).toFixed(2));
      return;
    }
    if (cents === settings.monthly_overhead_cents) return;
    void saveSettings({ monthly_overhead_cents: cents });
  };
  const commitVolume = () => {
    const vol = parseInt(volumeInput, 10);
    if (!Number.isFinite(vol) || vol < 1) {
      setVolumeInput(String(settings.target_monthly_volume));
      return;
    }
    if (vol === settings.target_monthly_volume) return;
    void saveSettings({ target_monthly_volume: vol });
  };

  const startCostEdit = (productId: string) => {
    const current = productCost(productId);
    setEditingCostFor(productId);
    setEditingCostUsd((current / 100).toFixed(2));
  };
  const saveCostEdit = async () => {
    if (!editingCostFor) return;
    const cents = Math.round(parseFloat(editingCostUsd) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setEditingCostFor(null);
      return;
    }
    try {
      const response = await fetch(`/api/admin/products/${editingCostFor}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost_cents: cents }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Save failed');
      // Optimistically update the local products list so the table
      // re-renders without a full refetch.
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingCostFor ? { ...p, cost_cents: cents } : p
        )
      );
      setEditingCostFor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <AdminLayout>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <h1 className="text-3xl font-bold">Wholesale</h1>
        <Link
          href="/admin/wholesale/quotes"
          className="btn btn-primary"
          style={{ textDecoration: 'none' }}
        >
          Quote builder →
        </Link>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <PlanBanner
        actualDoors={
          accounts.filter((a) => a.approval_status === 'approved').length
        }
        compact
      />
      <DoorPipeline
        approvedDoors={
          accounts.filter((a) => a.approval_status === 'approved').length
        }
        pendingDoors={
          accounts.filter((a) => a.approval_status === 'pending').length
        }
      />

      <WholesaleLineSheetCard />

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
                      <td className="capitalize">{tierLabel(account.tier)}</td>
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
                  {WHOLESALE_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {TIER_META[t].label}
                    </option>
                  ))}
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

              {selectedAccount.approval_status === 'approved' && (
                <div className="pt-2">
                  <p className="text-gray-600">Welcome discount codes</p>
                  {(codesByAccount[selectedAccount.id]?.length ?? 0) > 0 ? (
                    <div className="flex flex-col gap-1 mt-1">
                      {codesByAccount[selectedAccount.id].map((c) => (
                        <div
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard?.writeText(c.code)
                            }
                            title="Click to copy"
                            className="font-mono text-xs"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: c.redeemed_at
                                ? 'var(--admin-text-muted)'
                                : 'var(--c-lime)',
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: c.redeemed_at
                                ? 'line-through'
                                : 'none',
                            }}
                          >
                            {c.code}
                          </button>
                          <span
                            className="text-xs"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            {c.percent_off}% ·{' '}
                            {c.kind === 'first_order' ? 'first order' : 'referral'}
                            {c.redeemed_at ? ' · used' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateCodes(selectedAccount)}
                      className="btn btn-secondary mt-1"
                      disabled={generatingCodes}
                    >
                      {generatingCodes ? 'Issuing…' : 'Issue & email codes'}
                    </button>
                  )}
                </div>
              )}

              {selectedAccount.approval_status === 'pending' && (
                <div className="flex flex-col gap-2 pt-4">
                  <button
                    onClick={() =>
                      handleApprove(selectedAccount, selectedAccount.tier)
                    }
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    Approve as {tierLabel(selectedAccount.tier)}
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

      <div
        className="card"
        style={{ marginBottom: '1.25rem' }}
        aria-labelledby="cost-assumptions"
      >
        <h2 className="card-title" id="cost-assumptions">
          Cost Assumptions
        </h2>

        <div style={{ marginTop: '0.5rem' }}>
          <div
            className="form-label"
            style={{ marginBottom: '0.4rem' }}
            id="basis-label"
          >
            Production basis
          </div>
          <div
            role="radiogroup"
            aria-labelledby="basis-label"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}
          >
            {(
              [
                'diy_tier1',
                'diy_tier2',
                'diy_tier3',
                'copacker',
                'inhouse',
              ] as CostBasis[]
            ).map((basis) => {
              const active = settings.active_cost_basis === basis;
              const saving = savingBasis === basis;
              const busy = savingBasis !== null;
              return (
                <button
                  key={basis}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={busy && !saving}
                  onClick={() => {
                    if (active || busy) return;
                    void saveSettings({ active_cost_basis: basis });
                  }}
                  title={BASIS_HINTS[basis]}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: 8,
                    border: active
                      ? '1px solid var(--c-lime)'
                      : '1px solid var(--admin-border)',
                    background: active
                      ? 'rgba(168, 255, 60, 0.12)'
                      : saving
                      ? 'rgba(0, 240, 255, 0.10)'
                      : 'var(--admin-surface-soft)',
                    color: active
                      ? 'var(--c-lime-text)'
                      : saving
                      ? 'var(--c-cyan-text)'
                      : 'var(--admin-text)',
                    cursor: busy ? 'wait' : active ? 'default' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: active ? 700 : 500,
                    opacity: busy && !saving ? 0.5 : 1,
                  }}
                >
                  {saving ? `Switching to ${BASIS_LABELS[basis]}…` : BASIS_LABELS[basis]}
                </button>
              );
            })}
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--admin-text-muted)',
              marginTop: '0.45rem',
              lineHeight: 1.5,
            }}
          >
            {BASIS_HINTS[settings.active_cost_basis]}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            alignItems: 'flex-end',
            marginTop: '1rem',
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="overhead-input">
              Fixed monthly overhead (USD)
            </label>
            <input
              id="overhead-input"
              type="number"
              step="0.01"
              min="0"
              value={overheadUsdInput}
              onChange={(e) => setOverheadUsdInput(e.target.value)}
              onBlur={commitOverhead}
              onKeyDown={(e) => e.key === 'Enter' && commitOverhead()}
              className="form-input"
              style={{ width: 140 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="volume-input">
              Assumed monthly volume (units)
            </label>
            <input
              id="volume-input"
              type="number"
              min="1"
              value={volumeInput}
              onChange={(e) => setVolumeInput(e.target.value)}
              onBlur={commitVolume}
              onKeyDown={(e) => e.key === 'Enter' && commitVolume()}
              className="form-input"
              style={{ width: 140 }}
            />
          </div>
          <div
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 8,
              background: 'rgba(123, 45, 255, 0.10)',
              border: '1px solid rgba(123, 45, 255, 0.28)',
              fontSize: '0.85rem',
              alignSelf: 'center',
            }}
          >
            Overhead absorbed per unit:{' '}
            <strong style={{ color: 'var(--c-uv-text)' }}>
              {formatCentsToUSD(overheadPerUnitCents)}
            </strong>
          </div>
        </div>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted)',
            marginTop: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          Net margin below subtracts <em>both</em> material cost and this
          amortized overhead from every wholesale price. If a row reads
          negative, it means the wholesale price minus material is less than
          the{' '}
          <strong style={{ color: 'var(--c-uv-text)' }}>
            {formatCentsToUSD(overheadPerUnitCents)}
          </strong>{' '}
          overhead chunk — bump assumed volume up or fixed overhead down to
          shrink that chunk. Material cost is editable inline (click any cost
          cell); the value pins to the active production basis, so each
          scenario keeps its own number.
        </p>
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
                      tier: e.target.value as WholesaleTier,
                    })
                  }
                  className="form-select"
                >
                  {WHOLESALE_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {TIER_META[t].label}
                    </option>
                  ))}
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
                  flexWrap: 'wrap',
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
                    Material:&nbsp;
                  </span>
                  <strong>
                    {previewCostCents
                      ? formatCentsToUSD(previewCostCents)
                      : '— (not set)'}
                  </strong>
                </span>
                <span>
                  <span style={{ color: 'var(--admin-text-muted)' }}>
                    Overhead/unit:&nbsp;
                  </span>
                  <strong>{formatCentsToUSD(overheadPerUnitCents)}</strong>
                </span>
                {previewPriceCents > 0 && (
                  <>
                    <span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        Material %:&nbsp;
                      </span>
                      <strong
                        style={{ color: marginColor(previewMaterialMargin) }}
                      >
                        {previewMaterialMargin === null
                          ? '—'
                          : `${previewMaterialMargin.toFixed(1)}%`}
                      </strong>
                    </span>
                    <span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        Net %:&nbsp;
                      </span>
                      <strong style={{ color: marginColor(previewNetMargin) }}>
                        {previewNetMargin === null
                          ? '—'
                          : `${previewNetMargin.toFixed(1)}%`}
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
                <th>Material cost</th>
                <th>Price/unit</th>
                <th title="Price minus material cost only">Material %</th>
                <th title="Price minus material cost AND amortized overhead">
                  Net %
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((row) => {
                const cost = productCost(row.product_id);
                const matPct = materialMarginPct(row.price_cents, cost);
                const netPct = netMarginPct(row.price_cents, cost);
                const isEditing = editingCostFor === row.product_id;
                return (
                  <tr key={row.id}>
                    <td className="font-medium">{productName(row.product_id)}</td>
                    <td className="capitalize">{tierLabel(row.tier)}</td>
                    <td>{row.min_quantity}</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingCostUsd}
                          autoFocus
                          onChange={(e) => setEditingCostUsd(e.target.value)}
                          onBlur={saveCostEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCostEdit();
                            if (e.key === 'Escape') setEditingCostFor(null);
                          }}
                          className="form-input"
                          style={{ width: 90, padding: '0.25rem 0.5rem' }}
                        />
                      ) : (
                        <button
                          onClick={() => startCostEdit(row.product_id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: cost ? 'inherit' : 'var(--c-magenta)',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit',
                            textDecoration: 'underline dotted',
                            textUnderlineOffset: '3px',
                          }}
                          title="Click to edit material cost"
                        >
                          {cost ? formatCentsToUSD(cost) : 'set cost'}
                        </button>
                      )}
                    </td>
                    <td>{formatCentsToUSD(row.price_cents)}</td>
                    <td
                      style={{
                        color: marginColor(matPct),
                        fontWeight: 600,
                      }}
                    >
                      {matPct === null ? '—' : `${matPct.toFixed(1)}%`}
                    </td>
                    <td
                      style={{
                        color: marginColor(netPct),
                        fontWeight: 700,
                      }}
                    >
                      {netPct === null ? '—' : `${netPct.toFixed(1)}%`}
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
          <strong>Material %</strong> = (price − material cost) ÷ price.{' '}
          <strong>Net %</strong> additionally subtracts overhead/unit at the
          assumed volume above. Color thresholds: cherry &lt;0%, magenta
          &lt;15%, sodium &lt;30%, lime ≥30%. Material costs are sourced from
          the Wholesale Costing &amp; Margin Workbook (DIY active tier,
          Amazon/bulk-anchored placeholders) and editable inline.
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
