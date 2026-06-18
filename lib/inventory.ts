import 'server-only';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNotificationEmail } from '@/lib/email';

/**
 * Below this many producible pops of any single flavor, we email the admins.
 * "Producible" = how many pops the limiting raw-material can still make.
 */
export const LOW_STOCK_POP_THRESHOLD = 50;

interface ProducibleRow {
  product_id: string;
  sku: string;
  name: string;
  producible: number;
}

/**
 * Deduct raw-material ingredients for a paid order, then check whether any
 * flavor has dropped below the producible-pops threshold and email the admins
 * on a *new* crossing (so we don't spam on every subsequent order).
 *
 * Fire-and-forget safe: every step is wrapped so a failure here never breaks
 * the Stripe webhook. Best-effort by design.
 */
export async function consumeIngredientsAndAlert(orderId: string): Promise<void> {
  const { error: consumeError } = await supabaseAdmin.rpc(
    'consume_ingredients_for_order',
    { p_order_id: orderId }
  );
  if (consumeError) {
    console.error('[inventory] consume_ingredients_for_order failed', {
      orderId,
      consumeError,
    });
    // Still check stock — the order may have failed to deduct but other
    // orders may have left us low.
  }

  await checkAndAlertLowStock();
}

/**
 * Recompute producible pops per flavor and email admins about any flavor that
 * newly fell below LOW_STOCK_POP_THRESHOLD. Flavors that recover above the
 * threshold reset their alert state so they can alert again next time.
 */
export async function checkAndAlertLowStock(): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc('producible_pops_by_flavor');
  if (error || !data) {
    console.error('[inventory] producible_pops_by_flavor failed', { error });
    return;
  }

  const rows = data as ProducibleRow[];

  // Load existing alert state so we only email on transitions into "low".
  const { data: stateRows } = await supabaseAdmin
    .from('low_stock_alert_state')
    .select('product_id, below_threshold');
  const wasBelow = new Map<string, boolean>(
    (stateRows ?? []).map((r) => [r.product_id as string, r.below_threshold as boolean])
  );

  const newlyLow: ProducibleRow[] = [];
  const stateUpserts: Array<{
    product_id: string;
    below_threshold: boolean;
    last_alerted_at: string | null;
  }> = [];

  const nowIso = new Date().toISOString();
  for (const row of rows) {
    const isBelow = row.producible < LOW_STOCK_POP_THRESHOLD;
    const previouslyBelow = wasBelow.get(row.product_id) ?? false;
    if (isBelow && !previouslyBelow) {
      newlyLow.push(row);
      stateUpserts.push({
        product_id: row.product_id,
        below_threshold: true,
        last_alerted_at: nowIso,
      });
    } else if (!isBelow && previouslyBelow) {
      // Recovered — clear the flag so a future dip alerts again.
      stateUpserts.push({
        product_id: row.product_id,
        below_threshold: false,
        last_alerted_at: null,
      });
    } else if (!wasBelow.has(row.product_id)) {
      // First time we've seen this flavor — record baseline without alerting
      // unless it's already low.
      stateUpserts.push({
        product_id: row.product_id,
        below_threshold: isBelow,
        last_alerted_at: isBelow ? nowIso : null,
      });
      if (isBelow) newlyLow.push(row);
    }
  }

  if (stateUpserts.length > 0) {
    const { error: upsertError } = await supabaseAdmin
      .from('low_stock_alert_state')
      .upsert(stateUpserts, { onConflict: 'product_id' });
    if (upsertError) {
      console.error('[inventory] failed to persist low_stock_alert_state', {
        upsertError,
      });
    }
  }

  if (newlyLow.length === 0) return;

  await emailAdminsLowStock(newlyLow);
}

async function emailAdminsLowStock(flavors: ProducibleRow[]): Promise<void> {
  const recipients = await getAdminEmails();
  if (recipients.length === 0) {
    console.warn('[inventory] low stock but no admin recipients configured');
    return;
  }

  const lines = flavors
    .map((f) => `  • ${f.name}: can make ~${f.producible} more pops`)
    .join('\n');

  const subject = `⚠️ Kiwi Pop low ingredient stock — ${flavors
    .map((f) => f.name)
    .join(', ')}`;

  const text = [
    'Heads up — at least one flavor has dropped below the 50-pop ingredient threshold.',
    '',
    'Flavors below threshold:',
    lines,
    '',
    'This is based on the limiting raw material for each flavor. Restock ingredients in the admin:',
    `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thekiwipop.com'}/admin/ingredients`,
    '',
    'You will not get another email for the same flavor until it recovers above 50 and dips again.',
  ].join('\n');

  for (const to of recipients) {
    // eslint-disable-next-line no-await-in-loop
    const res = await sendNotificationEmail({
      to,
      subject,
      text,
    });
    if (!res.ok) {
      console.error('[inventory] low-stock email failed', { to, reason: res.reason });
    }
  }
}

/** Every email on the admin allowlist (the source of truth for who's admin). */
async function getAdminEmails(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_email_allowlist')
    .select('email');
  if (error || !data) {
    console.error('[inventory] failed to load admin emails', { error });
    return [];
  }
  return data
    .map((r) => (r.email as string | null)?.trim())
    .filter((e): e is string => Boolean(e));
}
