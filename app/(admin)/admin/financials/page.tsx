'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { SheetEmbed } from '@/components/admin/SheetEmbed';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/format';
import { useState, useEffect } from 'react';

interface ExpenseRow {
  id: string;
  category: string;
  amount_cents: number;
  description: string | null;
  expense_date: string;
}

interface FinancialsSummary {
  stripe: {
    grossCents: number;
    refundedCents: number;
    netCents: number;
    chargeCount: number;
    refundedChargeCount: number;
    earliestChargeMs: number | null;
    latestChargeMs: number | null;
    errors: string[];
  };
  reconcile: {
    scanned_sessions: number;
    matched: number;
    marked_paid: number;
    marked_cancelled: number;
    errors: string[];
  };
  db: {
    paidOrderCents: number;
    paidOrderCount: number;
    pendingOrderCents: number;
    pendingOrderCount: number;
    cogsCents: number;
    expensesCents: number;
    cashDonationCents: number;
    cashDonations: Array<{
      id: string;
      amount_cents: number;
      donor_name: string | null;
      note: string | null;
      received_at: string;
    }>;
  };
  derived: {
    revenueCents: number;
    cogsCents: number;
    expensesCents: number;
    grossProfitCents: number;
    netIncomeCents: number;
  };
  generatedAt: string;
}

const EXPENSE_CATEGORIES = [
  'materials',
  'labor',
  'shipping',
  'marketing',
  'overhead',
] as const;
type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

interface ExpenseFormState {
  category: ExpenseCategory;
  amountUsd: string;
  description: string;
  expense_date: string;
}

const EMPTY_EXPENSE: ExpenseFormState = {
  category: 'overhead',
  amountUsd: '',
  description: '',
  expense_date: new Date().toISOString().slice(0, 10),
};

export default function FinancialsPage() {
  const [summary, setSummary] = useState<FinancialsSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormState>(EMPTY_EXPENSE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [summaryError, setSummaryError] = useState<string>('');

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    setSummaryError('');

    const summaryPromise = (async () => {
      try {
        const response = await fetch('/api/admin/financials/summary', {
          cache: 'no-store',
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? 'Failed to load financials');
        }
        setSummary(json as FinancialsSummary);
      } catch (err) {
        setSummaryError(
          err instanceof Error ? err.message : 'Failed to load financials',
        );
      }
    })();

    const expensesPromise = supabase
      .from('expenses')
      .select('id, category, amount_cents, description, expense_date')
      .order('expense_date', { ascending: false })
      .then(({ data }) => {
        setExpenses((data as ExpenseRow[]) ?? []);
      });

    await Promise.all([summaryPromise, expensesPromise]);
    setLoading(false);
  };

  const stats = summary
    ? {
        totalRevenue: summary.derived.revenueCents,
        totalExpenses: summary.derived.expensesCents,
        totalCOGS: summary.derived.cogsCents,
        grossMargin: summary.derived.netIncomeCents,
      }
    : { totalRevenue: 0, totalExpenses: 0, totalCOGS: 0, grossMargin: 0 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cents = Math.round(parseFloat(formData.amountUsd) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          amount_cents: cents,
          description: formData.description.trim() || undefined,
          expense_date: formData.expense_date,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Save failed');
      }
      setFormData(EMPTY_EXPENSE);
      setShowForm(false);
      await fetchFinancials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      const response = await fetch(`/api/admin/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? 'Delete failed');
      }
      await fetchFinancials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Financials</h1>

      {summaryError && (
        <div className="alert alert-error mb-4">
          Stripe sync failed: {summaryError}
        </div>
      )}

      {summary && (
        <div className="card mb-6">
          <h2 className="card-title">Stripe — live</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Gross collected</p>
              <p className="text-lg font-bold">
                {formatCentsToUSD(summary.stripe.grossCents)}
              </p>
              <p className="text-xs text-gray-500">
                {summary.stripe.chargeCount} charge
                {summary.stripe.chargeCount === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Refunded</p>
              <p className="text-lg font-bold text-red-600">
                ({formatCentsToUSD(summary.stripe.refundedCents)})
              </p>
              <p className="text-xs text-gray-500">
                {summary.stripe.refundedChargeCount} refund
                {summary.stripe.refundedChargeCount === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Net (Stripe)</p>
              <p className="text-lg font-bold">
                {formatCentsToUSD(summary.stripe.netCents)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Cash donations</p>
              <p className="text-lg font-bold">
                {formatCentsToUSD(summary.db.cashDonationCents)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            auto-reconciled · scanned {summary.reconcile.scanned_sessions} stripe
            sessions · marked paid {summary.reconcile.marked_paid} · cancelled{' '}
            {summary.reconcile.marked_cancelled} · generated{' '}
            {new Date(summary.generatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}

      <div className="dashboard-grid mb-6">
        <div className="stat-card">
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">{formatCentsToUSD(stats.totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Cost of Goods Sold</p>
          <p className="stat-value">{formatCentsToUSD(stats.totalCOGS)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Operating Expenses</p>
          <p className="stat-value">{formatCentsToUSD(stats.totalExpenses)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Net Profit</p>
          <p
            className="stat-value"
            style={{ color: stats.grossMargin >= 0 ? 'var(--primary)' : 'red' }}
          >
            {formatCentsToUSD(stats.grossMargin)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="card-title">P&L Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span>Revenue</span>
              <span className="font-bold">{formatCentsToUSD(stats.totalRevenue)}</span>
            </div>
            <div className="flex justify-between border-b pb-2 text-red-600">
              <span>COGS</span>
              <span className="font-bold">({formatCentsToUSD(stats.totalCOGS)})</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold">Gross Profit</span>
              <span className="font-bold">
                {formatCentsToUSD(stats.totalRevenue - stats.totalCOGS)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 text-red-600">
              <span>Operating Expenses</span>
              <span className="font-bold">
                ({formatCentsToUSD(stats.totalExpenses)})
              </span>
            </div>
            <div className="flex justify-between pt-2 text-lg">
              <span className="font-bold">Net Income</span>
              <span
                className="font-bold"
                style={{ color: stats.grossMargin >= 0 ? 'green' : 'red' }}
              >
                {formatCentsToUSD(stats.grossMargin)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Gross Margin</h2>

          <div className="text-center py-6">
            <p className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>
              {stats.totalRevenue > 0
                ? (((stats.totalRevenue - stats.totalCOGS) / stats.totalRevenue) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-gray-600 text-sm mt-2">
              of revenue after COGS
            </p>
          </div>

          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Revenue:</span>
              <span>{formatCentsToUSD(stats.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>COGS:</span>
              <span>{formatCentsToUSD(stats.totalCOGS)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Gross Profit:</span>
              <span>{formatCentsToUSD(stats.totalRevenue - stats.totalCOGS)}</span>
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="card mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Revenue line items</h2>
            <span className="text-sm text-gray-500">
              {formatCentsToUSD(summary.derived.revenueCents)} total · stripe
              net + cash
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Stripe — net of refunds</td>
                <td>{formatCentsToUSD(summary.stripe.netCents)}</td>
                <td className="text-sm text-gray-600">
                  {summary.stripe.chargeCount} charge
                  {summary.stripe.chargeCount === 1 ? '' : 's'}
                  {summary.stripe.refundedChargeCount > 0
                    ? ` · ${summary.stripe.refundedChargeCount} refunded`
                    : ''}
                </td>
                <td className="text-sm">
                  {summary.stripe.earliestChargeMs
                    ? `${new Date(summary.stripe.earliestChargeMs).toLocaleDateString()} – ${new Date(summary.stripe.latestChargeMs ?? summary.stripe.earliestChargeMs).toLocaleDateString()}`
                    : '—'}
                </td>
              </tr>
              {summary.db.cashDonations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-sm text-gray-500">
                    No cash donations logged yet.
                  </td>
                </tr>
              ) : (
                summary.db.cashDonations.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">
                      Cash donation
                      {c.donor_name ? ` · ${c.donor_name}` : ''}
                    </td>
                    <td>{formatCentsToUSD(c.amount_cents)}</td>
                    <td className="text-sm text-gray-700">
                      {c.note?.trim() ? c.note : 'cash donation'}
                    </td>
                    <td className="text-sm">
                      {new Date(c.received_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Expenses</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              + Record Expense
            </button>
          )}
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="card mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as ExpenseCategory,
                    })
                  }
                  className="form-select"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat[0]?.toUpperCase()}
                      {cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amountUsd}
                  onChange={(e) =>
                    setFormData({ ...formData, amountUsd: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expense_date: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Saving…' : 'Save expense'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(EMPTY_EXPENSE);
                  setError('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : expenses.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="font-medium capitalize">{expense.category}</td>
                  <td>{formatCentsToUSD(expense.amount_cents)}</td>
                  <td className="text-sm">{expense.description}</td>
                  <td className="text-sm">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </td>
                  <td className="text-sm">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No expenses recorded yet</p>
        )}
      </div>

      <SheetEmbed
        slug="financials"
        defaultLabel="Financials · P&L workbook"
        hint="P&L, COGS, expenses, and margin tracking that's faster to keep in sheets than in this UI."
      />
    </AdminLayout>
  );
}
