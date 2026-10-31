const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  TRANSACTIONAL_EMAIL_TYPES,
  MARKETING_EMAIL_TYPES,
  isMarketingEmailType,
  shouldSuppressEmail,
} = require('../lib/email-suppression');

const unsubscribed = { unsubscribed_at: '2026-10-31T00:00:00Z' };

describe('unsubscribe suppression', () => {
  it('suppresses every marketing email once an address unsubscribes', () => {
    for (const type of MARKETING_EMAIL_TYPES) {
      assert.equal(shouldSuppressEmail(type, unsubscribed), true, type);
    }
  });

  it('still sends receipts and other transactional mail after unsubscribe', () => {
    for (const type of TRANSACTIONAL_EMAIL_TYPES) {
      assert.equal(shouldSuppressEmail(type, unsubscribed), false, type);
    }
    assert.equal(shouldSuppressEmail('order_confirmation', unsubscribed), false);
  });

  it('sends marketing to addresses that never unsubscribed', () => {
    assert.equal(shouldSuppressEmail('welcome', null), false);
    assert.equal(shouldSuppressEmail('welcome', { unsubscribed_at: null }), false);
  });

  it('treats unknown types as marketing so new emails default to suppressed', () => {
    assert.equal(isMarketingEmailType('some_new_promo'), true);
    assert.equal(shouldSuppressEmail('some_new_promo', unsubscribed), true);
  });

  it('covers every email type the queue knows about', () => {
    const known = [
      'welcome',
      'ingredient_deep_dive',
      'first_purchase_push',
      'order_confirmation',
      'review_request',
      'wholesale_approved',
      'admin_sale_alert',
      'abandoned_checkout',
    ];
    for (const type of known) {
      assert.ok(
        TRANSACTIONAL_EMAIL_TYPES.includes(type) || MARKETING_EMAIL_TYPES.includes(type),
        type
      );
    }
  });
});
