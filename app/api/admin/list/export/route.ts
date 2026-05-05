import { NextResponse, type NextRequest } from 'next/server';
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

const CSV_HEADERS = [
  'email',
  'first_name',
  'last_name',
  'marketing_opt_in',
  'source',
  'opted_in_at',
  'unsubscribed_at',
  'order_count',
  'total_spent_usd',
  'last_order_at',
  'last_address',
  'last_city',
  'last_state',
  'last_zip',
  'last_country',
  'signup_created_at',
] as const;

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Download the marketing list as a Mailchimp/Klaviyo-friendly CSV.
 *
 * Query params:
 *   ?opted_in=1   only export rows with marketing_opt_in=true (default off)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const optedInOnly = request.nextUrl.searchParams.get('opted_in') === '1';

  const [signupsResp, ordersResp] = await Promise.all([
    supabaseAdmin
      .from('email_signups')
      .select(
        'email, source, first_name, last_name, marketing_opt_in, opted_in_at, unsubscribed_at, created_at',
      )
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

  const lines: string[] = [CSV_HEADERS.join(',')];
  for (const email of allEmails) {
    const signup = signupsByEmail.get(email);
    const orderAgg = ordersByEmail.get(email);
    const optIn = signup?.marketing_opt_in ?? false;
    if (optedInOnly && !optIn) continue;

    const firstName = signup?.first_name ?? orderAgg?.firstName ?? null;
    const lastName = signup?.last_name ?? orderAgg?.lastName ?? null;
    const totalSpent = (orderAgg?.totalSpentCents ?? 0) / 100;

    const row = [
      email,
      firstName,
      lastName,
      optIn ? 'true' : 'false',
      signup?.source ?? 'order-only',
      signup?.opted_in_at,
      signup?.unsubscribed_at,
      orderAgg?.orderCount ?? 0,
      totalSpent.toFixed(2),
      orderAgg?.lastOrderAt,
      orderAgg?.lastAddress?.address,
      orderAgg?.lastAddress?.city,
      orderAgg?.lastAddress?.state,
      orderAgg?.lastAddress?.zip,
      orderAgg?.lastAddress?.country,
      signup?.created_at,
    ];
    lines.push(row.map(csvEscape).join(','));
  }

  const csv = lines.join('\r\n') + '\r\n';
  const today = new Date().toISOString().slice(0, 10);
  const filenameSuffix = optedInOnly ? '-opted-in' : '';

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kiwipop-list-${today}${filenameSuffix}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
