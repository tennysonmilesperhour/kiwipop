import { NextResponse, type NextRequest } from 'next/server';
import { restoreCartByRecoveryToken } from '@/lib/abandoned-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The cart behind a checkout recovery link, priced from today's catalog.
 * Returns product lines only, never the customer's email or address.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t') ?? '';
  const items = await restoreCartByRecoveryToken(token);
  if (items === null) {
    return NextResponse.json({ error: 'Link not recognised' }, { status: 404 });
  }
  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
