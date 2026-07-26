import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  buyLabelForDestination,
  isLabelProviderConfigured,
  labelProviderConfigurationError,
  labelProviderForCountry,
} from '@/lib/shipping-labels';

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
  subtotal_cents: number | null;
}

interface RouteContext {
  params: { id: string };
}

interface ExistingShipmentRow {
  id: string;
  carrier: string | null;
  tracking_number: string | null;
  label_url: string | null;
  shipped_at: string | null;
  provider: string | null;
  provider_shipment_id: string | null;
}

/**
 * Buy a country-appropriate label for a paid order, store the resulting
 * tracking + provider shipment id in the shipments table, and flip the
 * order to `shipped`. The label PDF itself is fetched on-demand by
 * `/api/admin/shipments/[id]/label.pdf` (so we don't bloat the DB) — the
 * `label_url` we store points there.
 *
 * Idempotent-ish: if a shipment row already exists with a tracking number,
 * returns it instead of creating a new label.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // When the client is auto-printing the freshly-bought label, mark it printed
  // so it doesn't also show up in the "print unprinted labels" batch.
  let markPrinted = false;
  try {
    const body = (await request.json()) as { markPrinted?: boolean } | null;
    markPrinted = body?.markPrinted === true;
  } catch {
    // no body / not JSON — treat as not auto-printing
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_email, shipping_address, subtotal_cents')
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
  const destinationCountry = order.shipping_address?.country || 'US';
  if (!isLabelProviderConfigured(destinationCountry)) {
    return NextResponse.json(
      { error: labelProviderConfigurationError(destinationCountry) },
      { status: 503 },
    );
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

  const { data: existingRows } = await supabaseAdmin
    .from('shipments')
    .select(
      'id, carrier, tracking_number, label_url, shipped_at, provider, provider_shipment_id',
    )
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<ExistingShipmentRow[]>();

  const existing = existingRows?.[0];
  if (existing && existing.tracking_number && existing.label_url) {
    return NextResponse.json({ shipment: existing, reused: true });
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
    label = await buyLabelForDestination({
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
      customsValueCents: order.subtotal_cents ?? 100,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Shipping provider error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // The label_url we save points at our own endpoint, which streams the
  // stored base64 PDF (persisted just below).
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  const now = new Date().toISOString();
  const insertedShipment = {
    order_id: order.id,
    carrier: label.carrier,
    tracking_number: label.trackingNumber,
    label_url: '', // filled in below once we know the shipment row id
    shipped_at: now,
    provider: labelProviderForCountry(destinationCountry),
    provider_shipment_id: label.providerShipmentId,
    service_level: label.serviceLevel,
    rate_cents: label.rateCents,
    // Persist the provider PDF so the label.pdf route can serve it reliably.
    label_pdf_base64: label.labelDataB64,
    printed_at: markPrinted ? now : null,
  };

  const { data: shipment, error: shipmentError } = await supabaseAdmin
    .from('shipments')
    .insert(insertedShipment)
    .select()
    .single();

  if (shipmentError || !shipment) {
    return NextResponse.json(
      {
        error:
          `Label was bought from ${labelProviderForCountry(destinationCountry)} but failed to save locally. Tracking number is included; print it from the provider dashboard if needed.`,
        details: shipmentError?.message,
        trackingNumber: label.trackingNumber,
        providerShipmentId: label.providerShipmentId,
      },
      { status: 500 },
    );
  }

  const labelUrl = `${origin}/api/admin/shipments/${shipment.id}/label.pdf`;
  await supabaseAdmin
    .from('shipments')
    .update({ label_url: labelUrl })
    .eq('id', shipment.id);

  if (order.status === 'paid') {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'shipped', updated_at: now })
      .eq('id', order.id);
  }

  return NextResponse.json({
    shipment: { ...shipment, label_url: labelUrl },
    rateCents: label.rateCents,
    serviceLevel: label.serviceLevel,
  });
}
