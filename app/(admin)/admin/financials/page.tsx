'use client';

import { AdminLayout } from '@/components/AdminLayout';
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
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalCOGS: 0,
    grossMargin: 0,
  });
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormState>(EMPTY_EXPENSE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    const { data: orders } = await supabase
      .from('orders')
      .select('total_cents, status')
      .eq('status', 'paid');

    const { data: expenseData } = await supabase
      .from('expenses')
      .select('id, category, amount_cents, description, expense_date')
      .order('expense_date', { ascending: false });

    const { data: batches } = await supabase
      .from('manufacturing_batches')
      .select('cost_cents, status')
      .eq('status', 'completed');

    const revenue = (orders ?? []).reduce(
      (sum, order) => sum + (order.total_cents || 0),
      0
    );
    const batchCosts = (batches ?? []).reduce(
      (sum, batch) => sum + (batch.cost_cents || 0),
      0
    );
    const totalExpenses = (expenseData ?? []).reduce(
      (sum, exp) => sum + (exp.amount_cents || 0),
      0
    );
    const totalCOGS = batchCosts;
    const grossMargin = revenue - totalCOGS - totalExpenses;

    setStats({
      totalRevenue: revenue,
      totalExpenses,
      totalCOGS,
      grossMargin,
    });
    setExpenses((expenseData as ExpenseRow[]) ?? []);
    setLoading(false);
  };

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
    </AdminLayout>
  );
}
