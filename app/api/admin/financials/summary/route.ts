import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  loadStripeFinancialTotals,
  reconcilePendingOrdersWithStripe,
  type ReconcileSummary,
  type StripeFinancialTotals,
} from '@/lib/stripe-reconcile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OrderRow {
  status: string;
  total_cents: number | null;
}
interface ExpenseRow {
  amount_cents: number | null;
}
interface BatchRow {
  cost_cents: number | null;
}
interface CashDonationRow {
  id: string;
  amount_cents: number | null;
  donor_name: string | null;
  note: string | null;
  received_at: string;
}

export interface FinancialsSummary {
  stripe: StripeFinancialTotals;
  reconcile: ReconcileSummary;
  db: {
    paidOrderCents: number;
    paidOrderCount: number;
    pendingOrderCents: number;
    pendingOrderCount: number;
    cancelledOrderCents: number;
    cancelledOrderCount: number;
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
    /** Stripe-net + cash donations — what actually came in. */
    revenueCents: number;
    cogsCents: number;
    expensesCents: number;
    grossProfitCents: number;
    netIncomeCents: number;
  };
  generatedAt: string;
}

/**
 * Single source of truth for the admin financial dashboard. Auto-reconciles
 * pending orders against Stripe (so other DB-driven views like the
 * fundraiser progress bar self-heal too), then returns Stripe-derived
 * revenue alongside DB-tracked COGS, expenses, and cash donations.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const reconcile = await reconcilePendingOrdersWithStripe();

  const [stripe, ordersResp, expensesResp, batchesResp, cashResp] =
    await Promise.all([
      loadStripeFinancialTotals(),
      supabaseAdmin
        .from('orders')
        .select('status, total_cents')
        .returns<OrderRow[]>(),
      supabaseAdmin
        .from('expenses')
        .select('amount_cents')
        .returns<ExpenseRow[]>(),
      supabaseAdmin
        .from('manufacturing_batches')
        .select('cost_cents, status')
        .eq('status', 'completed')
        .returns<BatchRow[]>(),
      supabaseAdmin
        .from('cash_donations')
        .select('id, amount_cents, donor_name, note, received_at')
        .order('received_at', { ascending: false })
        .returns<CashDonationRow[]>(),
    ]);

  const orders = ordersResp.data ?? [];
  const expenses = expensesResp.data ?? [];
  const batches = batchesResp.data ?? [];
  const cash = cashResp.data ?? [];

  const paidStatuses = new Set(['paid', 'shipped', 'completed']);
  let paidOrderCents = 0;
  let paidOrderCount = 0;
  let pendingOrderCents = 0;
  let pendingOrderCount = 0;
  let cancelledOrderCents = 0;
  let cancelledOrderCount = 0;

  for (const o of orders) {
    const cents = o.total_cents ?? 0;
    if (paidStatuses.has(o.status)) {
      paidOrderCents += cents;
      paidOrderCount++;
    } else if (o.status === 'pending') {
      pendingOrderCents += cents;
      pendingOrderCount++;
    } else if (o.status === 'cancelled') {
      cancelledOrderCents += cents;
      cancelledOrderCount++;
    }
  }

  const cogsCents = batches.reduce((s, b) => s + (b.cost_cents ?? 0), 0);
  const expensesCents = expenses.reduce(
    (s, e) => s + (e.amount_cents ?? 0),
    0,
  );
  const cashDonationCents = cash.reduce(
    (s, c) => s + (c.amount_cents ?? 0),
    0,
  );

  // Revenue = what Stripe actually settled (net of refunds) + cash donations
  // logged manually. Stripe is the source of truth so the number is correct
  // even if a webhook missed and the orders table is stale.
  const revenueCents = stripe.netCents + cashDonationCents;
  const grossProfitCents = revenueCents - cogsCents;
  const netIncomeCents = grossProfitCents - expensesCents;

  const summary: FinancialsSummary = {
    stripe,
    reconcile,
    db: {
      paidOrderCents,
      paidOrderCount,
      pendingOrderCents,
      pendingOrderCount,
      cancelledOrderCents,
      cancelledOrderCount,
      cogsCents,
      expensesCents,
      cashDonationCents,
      cashDonations: cash.map((c) => ({
        id: c.id,
        amount_cents: c.amount_cents ?? 0,
        donor_name: c.donor_name,
        note: c.note,
        received_at: c.received_at,
      })),
    },
    derived: {
      revenueCents,
      cogsCents,
      expensesCents,
      grossProfitCents,
      netIncomeCents,
    },
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(summary);
}
