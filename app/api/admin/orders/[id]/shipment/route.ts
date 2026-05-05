import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * Returns the most recent shipment row for an order, or null. Used by
 * the order-detail modal to render either a "buy label" button or the
 * existing label/tracking link.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .select('id, order_id, carrier, tracking_number, label_url, shipped_at, delivered_at, created_at')
    .eq('order_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load shipment', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ shipment: data?.[0] ?? null });
}
