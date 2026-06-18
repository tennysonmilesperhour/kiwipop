import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { adminGrantSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OWNER_EMAIL = 'tennysontaggart@gmail.com';

interface AllowlistRow {
  email: string;
  granted_at: string;
  note: string | null;
}

interface ProfileRow {
  email: string | null;
  role: string;
  display_name: string | null;
}

/** List admins: the email allowlist joined with profile/login status. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const [allowRes, profileRes] = await Promise.all([
    supabaseAdmin
      .from('admin_email_allowlist')
      .select('email, granted_at, note')
      .order('granted_at', { ascending: true })
      .returns<AllowlistRow[]>(),
    supabaseAdmin
      .from('profiles')
      .select('email, role, display_name')
      .eq('role', 'admin')
      .returns<ProfileRow[]>(),
  ]);

  const profilesByEmail = new Map<string, ProfileRow>();
  for (const p of profileRes.data ?? []) {
    if (p.email) profilesByEmail.set(p.email.toLowerCase(), p);
  }

  const admins = (allowRes.data ?? []).map((row) => {
    const profile = profilesByEmail.get(row.email.toLowerCase());
    return {
      email: row.email,
      note: row.note,
      granted_at: row.granted_at,
      has_account: Boolean(profile),
      display_name: profile?.display_name ?? null,
      is_owner: row.email.toLowerCase() === OWNER_EMAIL,
      is_self: row.email.toLowerCase() === (auth.email ?? '').toLowerCase(),
    };
  });

  return NextResponse.json({ admins });
}

/** Add an admin: allowlist the email and promote any existing profile. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = adminGrantSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const email = parsed.email.toLowerCase();

  const { error: allowError } = await supabaseAdmin
    .from('admin_email_allowlist')
    .upsert(
      { email, note: parsed.note || `granted by ${auth.email ?? 'admin'}` },
      { onConflict: 'email' }
    );

  if (allowError) {
    return NextResponse.json(
      { error: 'Failed to allowlist email', details: allowError.message },
      { status: 500 }
    );
  }

  // Promote an existing profile immediately; a future signup auto-promotes via
  // the handle_new_user trigger.
  await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .ilike('email', email);

  return NextResponse.json({ ok: true });
}

/** Revoke an admin: remove from allowlist and demote their profile. */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  if (email === OWNER_EMAIL) {
    return NextResponse.json(
      { error: 'The project owner cannot be removed.' },
      { status: 403 }
    );
  }
  if (email === (auth.email ?? '').toLowerCase()) {
    return NextResponse.json(
      { error: "You can't remove your own admin access." },
      { status: 403 }
    );
  }

  const { error: delError } = await supabaseAdmin
    .from('admin_email_allowlist')
    .delete()
    .eq('email', email);

  if (delError) {
    return NextResponse.json(
      { error: 'Failed to remove admin', details: delError.message },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from('profiles')
    .update({ role: 'customer' })
    .ilike('email', email);

  return NextResponse.json({ ok: true });
}
