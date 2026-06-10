import { NextResponse, type NextRequest } from 'next/server';
import { findRedeemableCode } from '@/lib/wholesale-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lightweight check used by the checkout UI to give live feedback on a
 * discount code before the customer submits. Returns whether the code is
 * currently redeemable and, if so, its percent off. Does not redeem anything.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const code =
    typeof (body as { code?: unknown })?.code === 'string'
      ? ((body as { code: string }).code as string).trim()
      : '';

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const match = await findRedeemableCode(code);
  if (!match) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  return NextResponse.json({
    valid: true,
    code: match.code,
    percentOff: match.percent_off,
  });
}
