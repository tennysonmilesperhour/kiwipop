import 'server-only';
import { supabaseAdmin } from './supabase-admin';

/**
 * Reads the site-wide "preorder only" flag from the app_settings singleton.
 *
 * When true, the whole storefront switches from normal sales to preorders as
 * the only option — see migration 047. Any read failure (missing column on a
 * not-yet-migrated database, network blip) degrades to `false` so the store
 * defaults to normal sales rather than accidentally hiding "buy now".
 */
export async function getPreorderOnlyMode(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('preorder_only_mode')
      .eq('id', 1)
      .maybeSingle<{ preorder_only_mode: boolean | null }>();

    if (error) return false;
    return data?.preorder_only_mode === true;
  } catch {
    return false;
  }
}
