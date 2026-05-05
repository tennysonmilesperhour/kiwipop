import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SignupRow {
  email: string;
  source: string;
  first_name: string | null;
  last_name: string | null;
  marketing_opt_in: boolean;
  opted_in_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

interface OrderRow {
  user_email: string | null;
  total_cents: number | null;
  status: string;
  created_at: string;
  shipping_address: {
    firstName?: string | null;
    lastName?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
}

export interface ContactRecord {
  email: string;
  first_name: string | null;
  last_name: string | null;
  marketing_opt_in: boolean;
  source: string;
  opted_in_at: string | null;
  unsubscribed_at: string | null;
  signup_created_at: string | null;
  order_count: number;
  total_spent_cents: number;
  last_order_at: string | null;
  last_address: OrderRow['shipping_address'];
}

/**
 * Build the unified marketing contact list — every email we have ever
 * captured from either the homepage form or checkout, joined with their
 * order history so admins can segment by spend / recency. Source of truth
 * for marketing_opt_in is the email_signups row; orders without an
 * email_signups row are included with marketing_opt_in=false so admins
 * can still see who they could re-engage.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const [signupsResp, ordersResp] = await Promise.all([
    supabaseAdmin
      .from('email_signups')
      .select(
        'email, source, first_name, last_name, marketing_opt_in, opted_in_at, unsubscribed_at, created_at',
      )
      .order('created_at', { ascending: false })
      .returns<SignupRow[]>(),
    supabaseAdmin
      .from('orders')
      .select('user_email, total_cents, status, created_at, shipping_address')
      .not('user_email', 'is', null)
      .order('created_at', { ascending: false })
      .returns<OrderRow[]>(),
  ]);

  const signupsByEmail = new Map<string, SignupRow>();
  for (const row of signupsResp.data ?? []) {
    signupsByEmail.set(row.email.toLowerCase(), row);
  }

  // Aggregate orders per email. Only paid-ish orders count toward
  // total_spent — pending/cancelled show order count but $0 spend.
  const paidStatuses = new Set(['paid', 'shipped', 'completed']);
  const ordersByEmail = new Map<
    string,
    {
      orderCount: number;
      totalSpentCents: number;
      lastOrderAt: string;
      lastAddress: OrderRow['shipping_address'];
      firstName: string | null;
      lastName: string | null;
    }
  >();

  for (const o of ordersResp.data ?? []) {
    if (!o.user_email) continue;
    const key = o.user_email.toLowerCase();
    const existing = ordersByEmail.get(key);
    const spend = paidStatuses.has(o.status) ? o.total_cents ?? 0 : 0;

    if (existing) {
      existing.orderCount += 1;
      existing.totalSpentCents += spend;
      // Orders are ordered newest-first, so the first one we see wins as
      // "last_order_at" and "last_address".
    } else {
      ordersByEmail.set(key, {
        orderCount: 1,
        totalSpentCents: spend,
        lastOrderAt: o.created_at,
        lastAddress: o.shipping_address,
        firstName: o.shipping_address?.firstName ?? null,
        lastName: o.shipping_address?.lastName ?? null,
      });
    }
  }

  const allEmails = new Set<string>([
    ...signupsByEmail.keys(),
    ...ordersByEmail.keys(),
  ]);

  const contacts: ContactRecord[] = [];
  for (const email of allEmails) {
    const signup = signupsByEmail.get(email);
    const orderAgg = ordersByEmail.get(email);
    contacts.push({
      email,
      first_name: signup?.first_name ?? orderAgg?.firstName ?? null,
      last_name: signup?.last_name ?? orderAgg?.lastName ?? null,
      marketing_opt_in: signup?.marketing_opt_in ?? false,
      source: signup?.source ?? 'order-only',
      opted_in_at: signup?.opted_in_at ?? null,
      unsubscribed_at: signup?.unsubscribed_at ?? null,
      signup_created_at: signup?.created_at ?? null,
      order_count: orderAgg?.orderCount ?? 0,
      total_spent_cents: orderAgg?.totalSpentCents ?? 0,
      last_order_at: orderAgg?.lastOrderAt ?? null,
      last_address: orderAgg?.lastAddress ?? null,
    });
  }

  contacts.sort((a, b) => {
    const aTime = Math.max(
      a.last_order_at ? Date.parse(a.last_order_at) : 0,
      a.signup_created_at ? Date.parse(a.signup_created_at) : 0,
    );
    const bTime = Math.max(
      b.last_order_at ? Date.parse(b.last_order_at) : 0,
      b.signup_created_at ? Date.parse(b.signup_created_at) : 0,
    );
    return bTime - aTime;
  });

  const optedInCount = contacts.filter((c) => c.marketing_opt_in).length;

  return NextResponse.json({
    contacts,
    totals: {
      total: contacts.length,
      opted_in: optedInCount,
      buyers: contacts.filter((c) => c.order_count > 0).length,
      buyers_opted_in: contacts.filter(
        (c) => c.order_count > 0 && c.marketing_opt_in,
      ).length,
    },
    generated_at: new Date().toISOString(),
  });
}
