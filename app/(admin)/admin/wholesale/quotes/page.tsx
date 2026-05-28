'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/format';
import { useState, useEffect } from 'react';

interface ProductOption {
  id: string;
  name: string;
  price_cents: number;
  cost_cents: number;
}

interface WholesaleAccountOption {
  id: string;
  business_name: string;
  tier: 'standard' | 'premium';
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface WholesalePricingRow {
  product_id: string;
  tier: 'standard' | 'premium';
  price_cents: number;
  min_quantity: number;
}

interface AppSettings {
  monthly_overhead_cents: number;
  target_monthly_volume: number;
}

interface QuoteLine {
  /** stable client-side id so we can remove rows without React key churn */
  uid: string;
  product_id: string;
  quantity: number;
  /** per-unit price in cents — auto-filled from tier match but admin can override */
  price_cents: number;
  /** true while the row's price is being auto-recomputed; flips false once the
   *  admin manually edits, so we don't clobber a deliberate override */
  auto_priced: boolean;
}

interface QuoteListRow {
  id: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total_cents: number;
  items: { product_id: string; quantity: number; price_cents: number }[];
  created_at: string;
  wholesale_account_id: string;
  wholesale_accounts: { business_name: string } | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  monthly_overhead_cents: 15000,
  target_monthly_volume: 100,
};

function newUid() {
  return Math.random().toString(36).slice(2);
}

export default function WholesaleQuotesPage() {
  const [accounts, setAccounts] = useState<WholesaleAccountOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [pricing, setPricing] = useState<WholesalePricingRow[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [quotes, setQuotes] = useState<QuoteListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Quote draft state
  const [accountId, setAccountId] = useState<string>('');
  const [lines, setLines] = useState<QuoteLine[]>([
    { uid: newUid(), product_id: '', quantity: 1, price_cents: 0, auto_priced: true },
  ]);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [acctRes, prodRes, priceRes, settingsRes, quotesRes] =
      await Promise.all([
        supabase
          .from('wholesale_accounts')
          .select('id, business_name, tier, approval_status')
          .eq('approval_status', 'approved')
          .order('business_name'),
        supabase
          .from('products')
          .select('id, name, price_cents, cost_cents')
          .order('name'),
        supabase
          .from('wholesale_pricing')
          .select('product_id, tier, price_cents, min_quantity')
          .order('min_quantity'),
        fetch('/api/admin/settings').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/admin/wholesale-quotes').then((r) =>
          r.ok ? r.json() : { quotes: [] }
        ),
      ]);
    setAccounts(acctRes.data ?? []);
    setProducts(prodRes.data ?? []);
    setPricing(priceRes.data ?? []);
    if (settingsRes) setSettings(settingsRes);
    setQuotes(quotesRes.quotes ?? []);
    setLoading(false);
  };

  const product = (id: string) => products.find((p) => p.id === id);

  // Tier resolver — picks the highest-min-qty tier whose threshold is met
  // by `quantity` for the given product. Falls back to retail price.
  const tierPriceCents = (
    productId: string,
    accountTier: 'standard' | 'premium' | undefined,
    quantity: number
  ): { price_cents: number; tier: 'standard' | 'premium' | 'retail' } => {
    const p = product(productId);
    if (!p) return { price_cents: 0, tier: 'retail' };
    const rows = pricing.filter((r) => r.product_id === productId);
    if (rows.length === 0)
      return { price_cents: p.price_cents, tier: 'retail' };

    // If the customer is on the premium account tier AND the line qty meets
    // the premium min, prefer premium. Otherwise the highest tier whose min
    // is met by qty. Otherwise retail.
    const sorted = [...rows].sort((a, b) => b.min_quantity - a.min_quantity);
    const candidates = sorted.filter((r) => quantity >= r.min_quantity);
    if (candidates.length === 0)
      return { price_cents: p.price_cents, tier: 'retail' };

    // Respect account-tier ceiling: a standard account can't get premium
    // pricing even if they meet the qty threshold.
    const ceiling = accountTier ?? 'premium';
    const allowed = candidates.filter((r) =>
      ceiling === 'standard' ? r.tier === 'standard' : true
    );
    const pick = allowed[0] ?? candidates[0];
    return { price_cents: pick.price_cents, tier: pick.tier };
  };

  const account = accounts.find((a) => a.id === accountId);
  const accountTier = account?.tier;

  // Recompute auto-priced lines whenever the account tier or quantity moves.
  // Manual price overrides are sticky (auto_priced=false).
  useEffect(() => {
    setLines((prev) =>
      prev.map((line) => {
        if (!line.auto_priced || !line.product_id) return line;
        const { price_cents } = tierPriceCents(
          line.product_id,
          accountTier,
          line.quantity
        );
        return { ...line, price_cents };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountTier, lines.map((l) => `${l.product_id}:${l.quantity}`).join(',')]);

  const updateLine = (uid: string, patch: Partial<QuoteLine>) => {
    setLines((prev) =>
      prev.map((l) => (l.uid === uid ? { ...l, ...patch } : l))
    );
  };
  const removeLine = (uid: string) =>
    setLines((prev) => prev.filter((l) => l.uid !== uid));
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      {
        uid: newUid(),
        product_id: '',
        quantity: 1,
        price_cents: 0,
        auto_priced: true,
      },
    ]);

  // Totals
  const validLines = lines.filter((l) => l.product_id && l.quantity > 0);
  const totalUnits = validLines.reduce((s, l) => s + l.quantity, 0);
  const subtotalCents = validLines.reduce(
    (s, l) => s + l.quantity * l.price_cents,
    0
  );
  const materialCostCents = validLines.reduce(
    (s, l) => s + l.quantity * (product(l.product_id)?.cost_cents ?? 0),
    0
  );
  const overheadPerUnitCents = Math.round(
    settings.monthly_overhead_cents /
      Math.max(1, settings.target_monthly_volume)
  );
  const overheadCents = overheadPerUnitCents * totalUnits;
  const profitCents = subtotalCents - materialCostCents - overheadCents;
  const marginPct = subtotalCents > 0 ? (profitCents / subtotalCents) * 100 : 0;
  const marginColor =
    marginPct < 0
      ? 'var(--c-cherry)'
      : marginPct < 15
      ? 'var(--c-magenta)'
      : marginPct < 30
      ? 'var(--c-sodium)'
      : 'var(--c-lime)';

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  const handleSave = async () => {
    if (!accountId) {
      setError('Pick a wholesale account first.');
      return;
    }
    if (validLines.length === 0) {
      setError('Add at least one line item with a product and quantity.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/wholesale-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wholesale_account_id: accountId,
          items: validLines.map((l) => ({
            product_id: l.product_id,
            quantity: l.quantity,
            price_cents: l.price_cents,
          })),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Save failed');
      setSuccess(`Quote saved · ${formatCentsToUSD(json.quote.total_cents)}`);
      setLines([
        {
          uid: newUid(),
          product_id: '',
          quantity: 1,
          price_cents: 0,
          auto_priced: true,
        },
      ]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    status: QuoteListRow['status']
  ) => {
    setError('');
    try {
      const response = await fetch(`/api/admin/wholesale-quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? 'Save failed');
      }
      await refresh();
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
        <h1 className="text-3xl font-bold">Wholesale · Quote Builder</h1>
        <Link href="/admin/wholesale" style={{ color: 'var(--c-cyan-text)' }}>
          ← back to accounts &amp; pricing
        </Link>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && (
        <div
          className="alert"
          style={{
            background: 'rgba(168, 255, 60, 0.10)',
            border: '1px solid var(--c-lime)',
            color: 'var(--c-lime-text)',
            padding: '0.6rem 0.9rem',
            borderRadius: 8,
            marginBottom: '1rem',
          }}
        >
          {success}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">New Quote</h2>

        <div className="form-group">
          <label className="form-label" htmlFor="quote-account">
            Wholesale account *
          </label>
          <select
            id="quote-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="">— pick an approved account —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.business_name} · {a.tier}
              </option>
            ))}
          </select>
          {!loading && accounts.length === 0 && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--admin-text-muted)',
                marginTop: '0.3rem',
              }}
            >
              No approved wholesale accounts yet — approve one on the{' '}
              <Link href="/admin/wholesale">accounts page</Link> first.
            </p>
          )}
        </div>

        {accountId && (
          <>
            <table className="table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Tier</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                  <th>Unit cost</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const p = product(line.product_id);
                  const { tier } = line.product_id
                    ? tierPriceCents(line.product_id, accountTier, line.quantity)
                    : { tier: 'retail' as const };
                  const lineTotal = line.quantity * line.price_cents;
                  return (
                    <tr key={line.uid}>
                      <td>
                        <select
                          value={line.product_id}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              product_id: e.target.value,
                              auto_priced: true,
                            })
                          }
                          className="form-select"
                          style={{ minWidth: 200 }}
                        >
                          <option value="">— select —</option>
                          {products.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              quantity: Math.max(
                                1,
                                parseInt(e.target.value, 10) || 1
                              ),
                            })
                          }
                          className="form-input"
                          style={{ width: 80 }}
                        />
                      </td>
                      <td
                        style={{
                          color:
                            tier === 'retail'
                              ? 'var(--admin-text-muted)'
                              : tier === 'premium'
                              ? 'var(--c-uv-text)'
                              : 'var(--c-cyan-text)',
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {tier}
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(line.price_cents / 100).toFixed(2)}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              price_cents: Math.round(
                                (parseFloat(e.target.value) || 0) * 100
                              ),
                              auto_priced: false,
                            })
                          }
                          className="form-input"
                          style={{ width: 100 }}
                          title={
                            line.auto_priced
                              ? 'Auto-filled from tier — edit to override'
                              : 'Manually overridden (clear product to reset)'
                          }
                        />
                      </td>
                      <td>{formatCentsToUSD(lineTotal)}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>
                        {p ? formatCentsToUSD(p.cost_cents) : '—'}
                      </td>
                      <td>
                        {lines.length > 1 && (
                          <button
                            onClick={() => removeLine(line.uid)}
                            className="text-red-600"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              onClick={addLine}
              className="btn btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              + Add line
            </button>
          </>
        )}

        {accountId && totalUnits > 0 && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: 10,
              background: 'rgba(0, 240, 255, 0.06)',
              border: '1px solid rgba(0, 240, 255, 0.18)',
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem 1.25rem',
              fontSize: '0.9rem',
            }}
          >
            <div>
              <div
                style={{
                  color: 'var(--admin-text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                Total units
              </div>
              <strong>{totalUnits.toLocaleString()}</strong>
            </div>
            <div>
              <div
                style={{
                  color: 'var(--admin-text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                Subtotal
              </div>
              <strong>{formatCentsToUSD(subtotalCents)}</strong>
            </div>
            <div>
              <div
                style={{
                  color: 'var(--admin-text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                Material cost
              </div>
              <strong>{formatCentsToUSD(materialCostCents)}</strong>
            </div>
            <div>
              <div
                style={{
                  color: 'var(--admin-text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                Overhead (@ {formatCentsToUSD(overheadPerUnitCents)}/unit)
              </div>
              <strong>{formatCentsToUSD(overheadCents)}</strong>
            </div>
            <div>
              <div
                style={{
                  color: 'var(--admin-text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                Net profit
              </div>
              <strong style={{ color: marginColor }}>
                {formatCentsToUSD(profitCents)} ({marginPct.toFixed(1)}%)
              </strong>
            </div>
          </div>
        )}

        {accountId && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              disabled={submitting || validLines.length === 0}
              className="btn btn-primary"
            >
              {submitting ? 'Saving…' : 'Save draft'}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Recent Quotes</h2>
        {loading ? (
          <p>Loading…</p>
        ) : quotes.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)' }}>
            No quotes yet — build one above.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const itemSummary = q.items
                  .map(
                    (i) => `${i.quantity}× ${productName(i.product_id)}`
                  )
                  .join(', ');
                return (
                  <tr key={q.id}>
                    <td className="font-medium">
                      {q.wholesale_accounts?.business_name ?? '—'}
                    </td>
                    <td
                      style={{
                        maxWidth: 320,
                        fontSize: '0.85rem',
                        color: 'var(--admin-text-soft)',
                      }}
                    >
                      {itemSummary}
                    </td>
                    <td>{formatCentsToUSD(q.total_cents)}</td>
                    <td>
                      <select
                        value={q.status}
                        onChange={(e) =>
                          handleStatusChange(
                            q.id,
                            e.target.value as QuoteListRow['status']
                          )
                        }
                        className="form-select"
                        style={{ fontSize: '0.85rem' }}
                      >
                        <option value="draft">draft</option>
                        <option value="sent">sent</option>
                        <option value="accepted">accepted</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </td>
                    <td
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
