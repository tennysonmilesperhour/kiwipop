import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UnprintedShipment {
  id: string;
  label_pdf_base64: string | null;
}

/**
 * How many bought-but-not-yet-printed labels are waiting. Drives the
 * "print unprinted labels (N)" button — cheap count so the UI can show it
 * without pulling the (large) PDF blobs.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { count, error } = await supabaseAdmin
    .from('shipments')
    .select('id', { count: 'exact', head: true })
    .is('printed_at', null)
    .not('label_pdf_base64', 'is', null);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to count unprinted labels', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ count: count ?? 0 });
}

/**
 * Merge every label that's been bought but not yet printed into one combined
 * PDF (4×6 page per label, FIFO by buy time) and stamp `printed_at` so they
 * don't come back next time. Returns the combined PDF as base64 plus the count.
 *
 * Returns: { pdfB64: string | null, count, failed }
 */
export async function POST() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data: shipments, error } = await supabaseAdmin
    .from('shipments')
    .select('id, label_pdf_base64')
    .is('printed_at', null)
    .not('label_pdf_base64', 'is', null)
    .order('created_at', { ascending: true })
    .returns<UnprintedShipment[]>();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load unprinted labels', details: error.message },
      { status: 500 },
    );
  }

  const pending = (shipments ?? []).filter(
    (s): s is { id: string; label_pdf_base64: string } =>
      Boolean(s.label_pdf_base64),
  );

  if (pending.length === 0) {
    return NextResponse.json({ pdfB64: null, count: 0, failed: 0 });
  }

  // Merge into one sheet. A single label that fails to parse is skipped (and
  // left unprinted so it can be retried) rather than tanking the whole batch.
  const merged = await PDFDocument.create();
  const mergedIds: string[] = [];
  let failed = 0;
  for (const s of pending) {
    try {
      const src = await PDFDocument.load(Buffer.from(s.label_pdf_base64, 'base64'));
      const pages = await merged.copyPages(src, src.getPageIndices());
      for (const p of pages) merged.addPage(p);
      mergedIds.push(s.id);
    } catch {
      failed += 1;
    }
  }

  if (mergedIds.length === 0) {
    return NextResponse.json(
      { error: 'Could not read any of the pending label PDFs', failed },
      { status: 500 },
    );
  }

  const bytes = await merged.save();
  const pdfB64 = Buffer.from(bytes).toString('base64');

  // Only stamp the labels that actually made it into the sheet. Guard on
  // printed_at IS NULL so a concurrent batch can't double-stamp.
  await supabaseAdmin
    .from('shipments')
    .update({ printed_at: new Date().toISOString() })
    .in('id', mergedIds)
    .is('printed_at', null);

  return NextResponse.json({ pdfB64, count: mergedIds.length, failed });
}
