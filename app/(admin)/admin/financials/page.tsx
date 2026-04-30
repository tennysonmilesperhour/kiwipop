'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatCentsToUSD } from '@/lib/stripe';
import { useState, useEffect } from 'react';

export default function FinancialsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalCOGS: 0,
    grossMargin: 0,
  });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    // Fetch orders for revenue
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_cents, status')
      .eq('status', 'paid');

    // Fetch expenses
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    // Fetch manufacturing costs
    const { data: batches, error: batchError } = await supabase
      .from('manufacturing_batches')
      .select('cost_cents, status')
      .eq('status', 'completed');

    if (!ordersError && orders) {
      const revenue = orders.reduce((sum, order) => sum + (order.total_cents || 0), 0);
      const batchCosts = batches
        ? batches.reduce((sum, batch) => sum + (batch.cost_cents || 0), 0)
        : 0;
      const totalExpenses = expenseData
        ? expenseData.reduce((sum, exp) => sum + (exp.amount_cents || 0), 0)
        : 0;
      const totalCOGS = batchCosts;
      const grossMargin = revenue - totalCOGS - totalExpenses;

      setStats({
        totalRevenue: revenue,
        totalExpenses,
        totalCOGS,
        grossMargin,
      });
      setExpenses(expenseData || []);
    }

    setLoading(false);
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
        <h2 className="card-title">Expenses</h2>

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
