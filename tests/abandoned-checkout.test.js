const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  RECOVERY_MAX_AGE_HOURS,
  decideRecovery,
  latestPerEmail,
} = require('../lib/abandoned-checkout-rules');

const NOW = new Date('2026-11-02T09:00:00Z');
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600 * 1000).toISOString();
const ITEMS = [{ product_id: 'p1', name: 'kiwi pop', quantity: 2, price_cents: 500 }];
const clean = { now: NOW, hasPaidSince: false, unsubscribed: false, emailedRecently: false };

describe('checkout recovery rules', () => {
  it('sends for a fresh cart with an email and nothing blocking it', () => {
    const row = { abandoned_at: hoursAgo(20), email: 'a@b.co', items: ITEMS };
    assert.deepEqual(decideRecovery(row, clean), { action: 'send' });
  });

  it('never emails a backlog: anything past the window is skipped', () => {
    const row = { abandoned_at: hoursAgo(RECOVERY_MAX_AGE_HOURS + 1), email: 'a@b.co', items: ITEMS };
    assert.deepEqual(decideRecovery(row, clean), { action: 'skip', reason: 'too_old' });
  });

  it('waits on a cart that only just expired', () => {
    const row = { abandoned_at: hoursAgo(0.25), email: 'a@b.co', items: ITEMS };
    assert.deepEqual(decideRecovery(row, clean), { action: 'wait' });
  });

  it('skips buyers, unsubscribers, and anyone emailed recently', () => {
    const row = { abandoned_at: hoursAgo(20), email: 'a@b.co', items: ITEMS };
    assert.equal(decideRecovery(row, { ...clean, hasPaidSince: true }).reason, 'purchased');
    assert.equal(decideRecovery(row, { ...clean, unsubscribed: true }).reason, 'unsubscribed');
    assert.equal(decideRecovery(row, { ...clean, emailedRecently: true }).reason, 'emailed_recently');
  });

  it('skips rows without an email or without items', () => {
    assert.equal(
      decideRecovery({ abandoned_at: hoursAgo(20), email: '', items: ITEMS }, clean).reason,
      'no_email'
    );
    assert.equal(
      decideRecovery({ abandoned_at: hoursAgo(20), email: 'a@b.co', items: [] }, clean).reason,
      'empty_cart'
    );
  });

  it('keeps only the newest cart per address, case-insensitively', () => {
    const rows = [
      { id: '1', email: 'A@b.co', abandoned_at: hoursAgo(30) },
      { id: '2', email: 'a@b.co', abandoned_at: hoursAgo(10) },
      { id: '3', email: 'c@d.co', abandoned_at: hoursAgo(5) },
    ];
    const { keep, duplicates } = latestPerEmail(rows);
    assert.deepEqual(keep.map((r) => r.id), ['2', '3']);
    assert.deepEqual(duplicates.map((r) => r.id), ['1']);
  });
});

const { abandonedAtFromSession } = require('../lib/abandoned-checkout-rules');

describe('abandoned_at comes from the Stripe session', () => {
  it('uses the session expiry, not the time reconcile noticed it', () => {
    const expiredFiveDaysAgo = Math.floor(NOW.getTime() / 1000) - 5 * 24 * 3600;
    const abandonedAt = abandonedAtFromSession(expiredFiveDaysAgo, NOW);
    assert.equal(abandonedAt, new Date(expiredFiveDaysAgo * 1000).toISOString());
    // ...so a late-found old cart is still too old to email.
    assert.deepEqual(
      decideRecovery({ abandoned_at: abandonedAt, email: 'a@b.co', items: ITEMS }, clean),
      { action: 'skip', reason: 'too_old' }
    );
  });

  it('a late-found old cart does not outrank a newer one for the same address', () => {
    const oldExpiry = Math.floor(NOW.getTime() / 1000) - 4 * 24 * 3600;
    const rows = [
      { id: 'old', email: 'a@b.co', abandoned_at: abandonedAtFromSession(oldExpiry, NOW) },
      { id: 'new', email: 'a@b.co', abandoned_at: hoursAgo(10) },
    ];
    assert.deepEqual(latestPerEmail(rows).keep.map((r) => r.id), ['new']);
  });

  it('falls back to now without a usable expiry, and never returns the future', () => {
    assert.equal(abandonedAtFromSession(null, NOW), NOW.toISOString());
    assert.equal(abandonedAtFromSession(undefined, NOW), NOW.toISOString());
    const future = Math.floor(NOW.getTime() / 1000) + 3600;
    assert.equal(abandonedAtFromSession(future, NOW), NOW.toISOString());
  });
});
