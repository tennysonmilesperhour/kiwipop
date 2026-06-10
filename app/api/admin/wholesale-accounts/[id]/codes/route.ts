import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  ensureWholesaleCodes,
  resolveAccountEmail,
  WHOLESALE_DISCOUNT_PERCENT,
} from '@/lib/wholesale-codes';
import { sendEmailNow } from '@/lib/email-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * Generate (idempotently) the welcome discount codes for an already-approved
 * wholesale account and email them out. Used for accounts approved before the
 * codes feature existed, or to re-send the welcome email.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data: account, error: accountError } = await supabaseAdmin
    .from('wholesale_accounts')
    .select('id, business_name, approval_status')
    .eq('id', params.id)
    .maybeSingle<{
      id: string;
      business_name: string;
      approval_status: string;
    }>();

  if (accountError || !account) {
    return NextResponse.json(
      { error: 'Wholesale account not found' },
      { status: 404 }
    );
  }

  if (account.approval_status !== 'approved') {
    return NextResponse.json(
      { error: 'Account must be approved before codes can be issued' },
      { status: 409 }
    );
  }

  try {
    const codes = await ensureWholesaleCodes(params.id);

    let emailed = false;
    const to = await resolveAccountEmail(params.id);
    if (to) {
      const result = await sendEmailNow(to, 'wholesale_approved', {
        businessName: account.business_name,
        percentOff: WHOLESALE_DISCOUNT_PERCENT,
        codes: codes.map((c) => ({ code: c.code, kind: c.kind })),
      });
      emailed = result.ok;
    }

    return NextResponse.json({ codes, emailed });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to generate codes',
        details: err instanceof Error ? err.message : 'unknown error',
      },
      { status: 500 }
    );
  }
}
