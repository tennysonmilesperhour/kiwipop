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
