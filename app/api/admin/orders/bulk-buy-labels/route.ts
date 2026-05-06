import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buyUspsLabel, isShipStationConfigured } from '@/lib/shipstation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(50),
});

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

interface ExistingShipment {
  order_id: string;
  tracking_number: string | null;
  label_url: string | null;
  provider_shipment_id: string | null;
}

interface PerOrderResult {
  orderId: string;
  ok: boolean;
  trackingNumber?: string;
  rateCents?: number;
  error?: string;
  /** True when we reused an existing shipment row instead of buying a new label. */
  reused?: boolean;
}

/**
 * Buy USPS labels for a batch of paid orders in parallel and return one
 * combined multi-page PDF (4×6 page per label). Works with `pdf-lib` to
 * merge the per-label base64 PDFs from ShipStation. Idempotent per order:
 * if a tracking number already exists for an order in the request, that
 * order is skipped (its existing label is included in the combined PDF
 * via fetchLabelPdf).
 *
 * Per-order failures don't fail the batch — the response includes a
 * `results` array with the outcome for each requested orderId, plus the
 * combined PDF as a base64 string for the orders that succeeded.
 *
 * Returns: { results: PerOrderResult[], pdfB64: string | null, succeeded, failed }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  if (!isShipStationConfigured()) {
    return NextResponse.json(
      {
        error:
          'SHIPSTATION_API_KEY / SHIPSTATION_API_SECRET are not configured.',
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { orderIds } = parsed.data;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_email, shipping_address')
    .in('id', orderIds)
    .returns<OrderRow[]>();

  if (ordersError) {
    return NextResponse.json(
      { error: 'Failed to load orders', details: ordersError.message },
      { status: 500 },
    );
  }

  const orderById = new Map<string, OrderRow>();
  for (const o of orders ?? []) orderById.set(o.id, o);

  const { data: existingShipments } = await supabaseAdmin
    .from('shipments')
    .select('order_id, tracking_number, label_url, provider_shipment_id')
    .in('order_id', orderIds)
    .returns<ExistingShipment[]>();

  const existingByOrder = new Map<string, ExistingShipment>();
  for (const s of existingShipments ?? []) {
    if (s.tracking_number) existingByOrder.set(s.order_id, s);
  }

  // Buy labels in parallel. Per-order failures are caught and surfaced in
  // results — they don't tank the rest of the batch.
  const labelB64s: Array<{ orderId: string; b64: string }> = [];
  const results: PerOrderResult[] = await Promise.all(
    orderIds.map(async (orderId): Promise<PerOrderResult> => {
      const order = orderById.get(orderId);
      if (!order) return { orderId, ok: false, error: 'Order not found' };
      if (order.shipping_address?.kind === 'donation') {
        return { orderId, ok: false, error: 'Donation — no label needed' };
      }
      if (existingByOrder.has(orderId)) {
        // Already labeled — skip the buy but still try to include the PDF
        return {
          orderId,
          ok: true,
          reused: true,
          trackingNumber:
            existingByOrder.get(orderId)?.tracking_number ?? undefined,
        };
      }
      if (order.status !== 'paid') {
        return {
          orderId,
          ok: false,
          error: `Order is ${order.status}, not paid`,
        };
      }
      const addr = order.shipping_address;
      if (!addr || !addr.address || !addr.city || !addr.state || !addr.zip) {
        return { orderId, ok: false, error: 'Missing shipping address' };
      }

      try {
        const fullName =
          [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim() ||
          'Kiwi Pop Customer';
        const label = await buyUspsLabel({
          to: {
            name: fullName,
            street1: addr.address,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            country: addr.country || 'US',
            email: order.user_email ?? null,
          },
          metadata: `order:${orderId.slice(0, 8)}`,
        });

        const now = new Date().toISOString();
        const { data: shipment, error: shipError } = await supabaseAdmin
          .from('shipments')
          .insert({
            order_id: orderId,
            carrier: 'usps',
            tracking_number: label.trackingNumber,
            label_url: '',
            shipped_at: now,
            provider: 'shipstation',
            provider_shipment_id: label.providerShipmentId,
            service_level: label.serviceLevel,
            rate_cents: label.rateCents,
          })
          .select('id')
          .single();

        if (shipError || !shipment) {
          return {
            orderId,
            ok: false,
            error: `bought but failed to save: ${shipError?.message ?? 'unknown'}`,
            trackingNumber: label.trackingNumber,
          };
        }

        const labelUrl = `${origin}/api/admin/shipments/${shipment.id}/label.pdf`;
        await supabaseAdmin
          .from('shipments')
          .update({ label_url: labelUrl })
          .eq('id', shipment.id);

        await supabaseAdmin
          .from('orders')
          .update({ status: 'shipped', updated_at: now })
          .eq('id', orderId)
          .eq('status', 'paid');

        labelB64s.push({ orderId, b64: label.labelDataB64 });

        return {
          orderId,
          ok: true,
          trackingNumber: label.trackingNumber,
          rateCents: label.rateCents,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ShipStation error';
        return { orderId, ok: false, error: message };
      }
    }),
  );

  // For any reused-existing rows, fetch their labels too (best-effort —
  // failures are non-fatal; user already has tracking numbers).
  const reusedIds = results.filter((r) => r.ok && r.reused).map((r) => r.orderId);
  if (reusedIds.length > 0) {
    const { fetchLabelPdf } = await import('@/lib/shipstation');
    await Promise.all(
      reusedIds.map(async (orderId) => {
        const ex = existingByOrder.get(orderId);
        if (!ex?.provider_shipment_id) return;
        try {
          const buf = await fetchLabelPdf(ex.provider_shipment_id);
          labelB64s.push({ orderId, b64: buf.toString('base64') });
        } catch {
          // skip; user can still print individually
        }
      }),
    );
  }

  let pdfB64: string | null = null;
  if (labelB64s.length > 0) {
    try {
      const merged = await PDFDocument.create();
      for (const { b64 } of labelB64s) {
        const src = await PDFDocument.load(Buffer.from(b64, 'base64'));
        const pages = await merged.copyPages(src, src.getPageIndices());
        for (const p of pages) merged.addPage(p);
      }
      const bytes = await merged.save();
      pdfB64 = Buffer.from(bytes).toString('base64');
    } catch (err) {
      // Merging failed — return individual results without combined PDF.
      console.error('[bulk-buy-labels] merge failed', err);
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    results,
    pdfB64,
    succeeded,
    failed,
  });
}
