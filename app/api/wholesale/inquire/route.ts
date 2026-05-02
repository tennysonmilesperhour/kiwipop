import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { wholesaleInquirySchema, type WholesaleInquiry } from '@/lib/validators';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOTIFY_EMAIL =
  process.env.WHOLESALE_NOTIFY_EMAIL ?? 'tennysontaggart@gmail.com';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  'retail-shop': 'retail shop · grocery / boutique',
  'cafe-bar': 'cafe / bar / late-night spot',
  'event-vendor': 'event / festival vendor',
  distributor: 'distributor / multi-account',
  'gym-studio': 'gym / studio / wellness',
  'online-store': 'online store',
  other: 'something else',
};

function formatNotificationBody(parsed: WholesaleInquiry, ip: string | null): string {
  const lines: string[] = [
    'NEW WHOLESALE INQUIRY · kiwi pop',
    '',
    `business name:    ${parsed.business_name}`,
    `contact name:     ${parsed.contact_name}`,
    `contact email:    ${parsed.contact_email}`,
  ];

  if (parsed.contact_phone) lines.push(`contact phone:    ${parsed.contact_phone}`);
  lines.push(`location:         ${parsed.location}`);
  if (parsed.business_type) {
    lines.push(
      `business type:    ${BUSINESS_TYPE_LABELS[parsed.business_type] ?? parsed.business_type}`,
    );
  }
  if (parsed.timeline) lines.push(`timeline:         ${parsed.timeline}`);

  lines.push('', '— looking to order —', parsed.looking_to_order);

  if (parsed.about_business) {
    lines.push('', '— about the business —', parsed.about_business);
  }

  lines.push('', '— meta —', `submitted from ip: ${ip ?? 'unknown'}`);
  lines.push(`submitted at:      ${new Date().toISOString()}`);

  return lines.join('\n');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let parsed: WholesaleInquiry;
  try {
    parsed = wholesaleInquirySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0]?.message ?? 'validation failed';
      return NextResponse.json(
        { error: first.toLowerCase(), issues: err.flatten() },
        { status: 400 },
      );
    }
    throw err;
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;
  const userAgent = request.headers.get('user-agent') ?? null;

  // 1. Persist a row of record. If the email forward fails for any reason,
  //    the inquiry is still durable in the DB and admins can find it.
  const { data: insertedRow, error: insertError } = await supabaseAdmin
    .from('wholesale_inquiries')
    .insert({
      business_name: parsed.business_name,
      contact_name: parsed.contact_name,
      contact_email: parsed.contact_email.toLowerCase(),
      contact_phone: parsed.contact_phone || null,
      location: parsed.location,
      business_type: parsed.business_type ?? null,
      looking_to_order: parsed.looking_to_order,
      about_business: parsed.about_business || null,
      timeline: parsed.timeline || null,
      source: 'wholesale-contact',
      ip_address: ip,
      user_agent: userAgent,
      notify_status: 'pending',
      status: 'new',
    })
    .select('id')
    .single();

  if (insertError || !insertedRow) {
    return NextResponse.json(
      { error: "couldn't save your inquiry, try again", details: insertError?.message },
      { status: 500 },
    );
  }

  // 2. Forward an email notification. Resend gracefully no-ops when the API
  //    key isn't set (local dev), so this never blocks a submission.
  const emailResult = await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `[kiwi pop wholesale] ${parsed.business_name} — ${parsed.location}`,
    text: formatNotificationBody(parsed, ip),
    replyTo: parsed.contact_email,
  });

  // 3. Record the forward outcome on the inquiry row so admins can see which
  //    inquiries actually went out by email.
  const notifyStatus = emailResult.ok
    ? 'sent'
    : emailResult.skipped
      ? 'skipped'
      : 'failed';

  await supabaseAdmin
    .from('wholesale_inquiries')
    .update({
      notify_status: notifyStatus,
      notify_error: emailResult.error ?? null,
    })
    .eq('id', insertedRow.id);

  return NextResponse.json(
    {
      ok: true,
      inquiry_id: insertedRow.id,
      notify_status: notifyStatus,
      message:
        "got it. we're building out the b2b side now and we'll be in touch with a product catalogue and to figure out next steps.",
    },
    { status: 201 },
  );
}
