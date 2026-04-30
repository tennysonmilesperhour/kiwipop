import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { wholesaleApplicationSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExistingAccount {
  id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

function buildIntakeNotes(parsed: {
  contact_email: string;
  contact_phone?: string;
  expected_monthly_units?: number;
  channel?: string;
  message?: string;
}): string {
  return [
    `contact_email=${parsed.contact_email}`,
    parsed.contact_phone ? `phone=${parsed.contact_phone}` : null,
    parsed.channel ? `channel=${parsed.channel}` : null,
    parsed.expected_monthly_units != null
      ? `expected_units_per_month=${parsed.expected_monthly_units}`
      : null,
    parsed.message ? `message=${parsed.message}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = wholesaleApplicationSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0]?.message ?? 'validation failed';
      return NextResponse.json(
        { error: first.toLowerCase(), issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error:
          'sign in or create an account first — wholesale applications are tied to a profile.',
      },
      { status: 401 }
    );
  }

  const taxIdValue = parsed.tax_id?.trim() || null;
  const intakeNotes = buildIntakeNotes(parsed);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('wholesale_accounts')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .maybeSingle<ExistingAccount>();

  if (existingError) {
    return NextResponse.json(
      { error: 'failed to check existing applications' },
      { status: 500 }
    );
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('wholesale_accounts')
      .update({
        business_name: parsed.business_name,
        tax_id: taxIdValue,
        intake_notes: intakeNotes,
        requested_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'failed to update application', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      account: updated,
      status: existing.approval_status,
      message:
        existing.approval_status === 'approved'
          ? "you're already approved. updated details on file."
          : 'application updated. status stays the same — admin will review.',
    });
  }

  const { data: account, error: insertError } = await supabaseAdmin
    .from('wholesale_accounts')
    .insert({
      user_id: user.id,
      business_name: parsed.business_name,
      tax_id: taxIdValue,
      approval_status: 'pending',
      tier: 'standard',
      intake_notes: intakeNotes,
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !account) {
    return NextResponse.json(
      { error: 'failed to submit application', details: insertError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      account,
      status: 'pending',
      message:
        "you're in the queue. we review applies in batches and email decisions to the contact email.",
    },
    { status: 201 }
  );
}
