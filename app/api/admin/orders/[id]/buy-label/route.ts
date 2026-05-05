import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buyUspsLabel, isShippoConfigured } from '@/lib/shippo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ShippingAddress {
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  kind?: string | null;
}

interface OrderRow {
  id: string;
  status: string;
  user_email: string | null;
  shipping_address: ShippingAddress | null;
}

interface RouteContext {
  params: { id: string };
}

/**
 * Buy a USPS label via Shippo for a paid order, store the resulting
 * tracking + PDF URL in the shipments table, and flip the order to
 * `shipped` so it falls into the right admin section. Idempotent-ish:
 * if a shipment row already exists for the order, returns it instead
 * of charging again.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  if (!isShippoConfigured()) {
    return NextResponse.json(
      {
        error:
          'SHIPPO_API_KEY is not configured. Add it in Vercel → Project Settings → Environment Variables to enable USPS label printing.',
      },
      { status: 503 },
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_email, shipping_address')
    .eq('id', params.id)
    .maybeSingle<OrderRow>();

  if (orderError) {
    return NextResponse.json(
      { error: 'Failed to load order', details: orderError.message },
      { status: 500 },
    );
  }
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.shipping_address?.kind === 'donation') {
    return NextResponse.json(
      { error: 'This is a donation — no label needed.' },
      { status: 400 },
    );
  }
  if (order.status !== 'paid' && order.status !== 'shipped') {
    return NextResponse.json(
      { error: `Order is ${order.status}; only paid orders can be labeled.` },
      { status: 409 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from('shipments')
    .select('id, carrier, tracking_number, label_url, shipped_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existing && existing.length > 0 && existing[0]!.label_url) {
    return NextResponse.json({ shipment: existing[0], reused: true });
  }

  const addr = order.shipping_address;
  if (!addr || !addr.address || !addr.city || !addr.state || !addr.zip) {
    return NextResponse.json(
      { error: 'Order is missing a shipping address — cannot buy a label.' },
      { status: 400 },
    );
  }

  const fullName =
    [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim() ||
    'Kiwi Pop Customer';

  let label;
  try {
    label = await buyUspsLabel({
      to: {
        name: fullName,
        street1: addr.address,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country || 'US',
        email: order.user_email ?? null,
      },
      metadata: `order:${order.id.slice(0, 8)}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Shippo error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { data: shipment, error: shipmentError } = await supabaseAdmin
    .from('shipments')
    .insert({
      order_id: order.id,
      carrier: 'usps',
      tracking_number: label.trackingNumber,
      label_url: label.labelUrl,
      shipped_at: now,
    })
    .select()
    .single();

  if (shipmentError || !shipment) {
    return NextResponse.json(
      {
        error:
          'Label was bought from Shippo but failed to save locally. The label URL is included so you can still print it.',
        details: shipmentError?.message,
        labelUrl: label.labelUrl,
        trackingNumber: label.trackingNumber,
      },
      { status: 500 },
    );
  }

  if (order.status === 'paid') {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'shipped', updated_at: now })
      .eq('id', order.id);
  }

  return NextResponse.json({
    shipment,
    rateCents: label.rateCents,
    serviceLevel: label.serviceLevel,
  });
}
