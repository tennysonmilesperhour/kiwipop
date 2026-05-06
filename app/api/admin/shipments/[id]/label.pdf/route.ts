import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { fetchLabelPdf } from '@/lib/shipstation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ShipmentRow {
  id: string;
  provider: string | null;
  provider_shipment_id: string | null;
  tracking_number: string | null;
}

interface RouteContext {
  params: { id: string };
}

/**
 * Stream the latest label PDF for a stored shipment. ShipStation /shipments/getlabel
 * regenerates the same PDF for a given shipmentId, so we don't persist the (~50KB
 * base64) blob — we just hold the provider_shipment_id and re-fetch on click.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .select('id, provider, provider_shipment_id, tracking_number')
    .eq('id', params.id)
    .maybeSingle<ShipmentRow>();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load shipment', details: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
  }
  if (data.provider !== 'shipstation' || !data.provider_shipment_id) {
    return NextResponse.json(
      {
        error:
          'This shipment was not created via ShipStation; no PDF re-fetch available.',
      },
      { status: 400 },
    );
  }

  let pdf: Buffer;
  try {
    pdf = await fetchLabelPdf(data.provider_shipment_id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ShipStation error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const filename = `kiwipop-label-${data.tracking_number ?? data.id}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
