/**
 * Pure rules for checkout abandonment recovery, kept in plain JS so
 * node --test can check them without a build step. The server side that
 * reads and writes the database is lib/abandoned-checkout.ts.
 *
 * Consent rules this encodes (see docs/abandoned-checkout-email.md):
 *   - only the address the customer typed into our checkout form
 *   - never after they paid, never after they unsubscribed
 *   - one email per abandoned cart, and at most one per address per 30 days
 *   - nothing older than 72 hours, so turning the switch on never emails a
 *     backlog of old carts
 */

const RECOVERY_MIN_AGE_HOURS = 1;
const RECOVERY_MAX_AGE_HOURS = 72;
const RECOVERY_COOLDOWN_DAYS = 30;

const HOUR_MS = 60 * 60 * 1000;

/**
 * @param {{ abandoned_at: string, email: string | null, items: unknown }} row
 * @param {{
 *   now: Date,
 *   hasPaidSince: boolean,
 *   unsubscribed: boolean,
 *   emailedRecently: boolean,
 * }} ctx
 * @returns {{ action: 'send' } | { action: 'wait' } | { action: 'skip', reason: string }}
 */
function decideRecovery(row, ctx) {
  const ageMs = ctx.now.getTime() - new Date(row.abandoned_at).getTime();
  if (!Number.isFinite(ageMs)) return { action: 'skip', reason: 'bad_date' };
  if (ageMs > RECOVERY_MAX_AGE_HOURS * HOUR_MS) {
    return { action: 'skip', reason: 'too_old' };
  }
  if (ageMs < RECOVERY_MIN_AGE_HOURS * HOUR_MS) return { action: 'wait' };
  if (!row.email || !row.email.includes('@')) {
    return { action: 'skip', reason: 'no_email' };
  }
  if (!Array.isArray(row.items) || row.items.length === 0) {
    return { action: 'skip', reason: 'empty_cart' };
  }
  if (ctx.hasPaidSince) return { action: 'skip', reason: 'purchased' };
  if (ctx.unsubscribed) return { action: 'skip', reason: 'unsubscribed' };
  if (ctx.emailedRecently) return { action: 'skip', reason: 'emailed_recently' };
  return { action: 'send' };
}

/**
 * A customer who retries checkout leaves several abandoned orders behind.
 * Keep only the newest per address; the rest are skipped as duplicates.
 *
 * @template {{ id: string, email: string, abandoned_at: string }} T
 * @param {ReadonlyArray<T>} rows
 * @returns {{ keep: T[], duplicates: T[] }}
 */
function latestPerEmail(rows) {
  /** @type {Map<string, T>} */
  const newest = new Map();
  for (const row of rows) {
    const key = (row.email || '').trim().toLowerCase();
    const current = newest.get(key);
    if (
      !current ||
      new Date(row.abandoned_at).getTime() > new Date(current.abandoned_at).getTime()
    ) {
      newest.set(key, row);
    }
  }
  const keepIds = new Set([...newest.values()].map((r) => r.id));
  return {
    keep: rows.filter((r) => keepIds.has(r.id)),
    duplicates: rows.filter((r) => !keepIds.has(r.id)),
  };
}

module.exports = {
  RECOVERY_MIN_AGE_HOURS,
  RECOVERY_MAX_AGE_HOURS,
  RECOVERY_COOLDOWN_DAYS,
  decideRecovery,
  latestPerEmail,
};
