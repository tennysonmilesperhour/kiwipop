import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (or your Vercel project settings).'
    );
  }

  // createBrowserClient from @supabase/ssr stores the session in cookies
  // (rather than localStorage), so middleware + server components can read
  // the same session via @supabase/ssr's createServerClient.
  return createBrowserClient(url, anonKey);
}

function getClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = buildClient();
  }
  return cachedClient;
}

/**
 * Browser-safe Supabase client. Lazy-initialized so module load during
 * static prerender doesn't fail when env vars are placeholder values.
 *
 * Uses cookie-based session storage so the middleware (also on @supabase/ssr)
 * can see the same session and admin role-checks work end-to-end.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
