import 'server-only';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from './supabase-server';
import { supabaseAdmin } from './supabase-admin';

interface AdminContext {
  userId: string;
  email: string | null;
  role: 'admin';
}

/**
 * Resolve the calling user from cookies and verify admin role.
 * Returns either an AdminContext or a NextResponse to short-circuit the route.
 */
export async function requireAdmin(): Promise<AdminContext | NextResponse> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: 'Failed to verify role' },
      { status: 500 }
    );
  }

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: 'admin',
  };
}
