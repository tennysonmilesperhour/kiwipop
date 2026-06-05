import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ShipmentRow {
  id: string;
  tracking_number: string | null;
  label_pdf_base64: string | null;
}

interface RouteContext {
  params: { id: string };
}

/**
 * Stream the stored label PDF for a shipment. We persist the base64 PDF that
 * ShipStation hands back on /shipments/createlabel (their V1 API has no
 * re-fetch-by-id endpoint), so this just decodes and streams it.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .select('id, tracking_number, label_pdf_base64')
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
  if (!data.label_pdf_base64) {
    return NextResponse.json(
      {
        error:
          'No stored label PDF for this shipment. It was created before label PDFs were saved — re-buy the label to regenerate it.',
      },
      { status: 404 },
    );
  }

  const pdf = Buffer.from(data.label_pdf_base64, 'base64');
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
