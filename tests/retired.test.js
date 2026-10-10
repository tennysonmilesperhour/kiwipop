const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  RETIRED_SKUS,
  RETIRED_ITEM_ERROR,
  isRetiredSku,
  retiredCheckoutRejection,
} = require('../lib/retired');

describe('retired products', () => {
  it('lists only the retired 3-pack', () => {
    assert.deepEqual([...RETIRED_SKUS], ['KP-PACK-3']);
    assert.equal(isRetiredSku('KP-PACK-3'), true);
    assert.equal(isRetiredSku('KP-PACK-6'), false);
    assert.equal(isRetiredSku('KP-KIWI-KITTY'), false);
    assert.equal(isRetiredSku(null), false);
    assert.equal(isRetiredSku(undefined), false);
  });

  it('rejects checkout when a cart contains a retired product', () => {
    const rejection = retiredCheckoutRejection([
      { id: 'live', sku: 'KP-KIWI-KITTY' },
      { id: '3749b41d-ace8-477c-a32e-c50a1961307e', sku: 'KP-PACK-3' },
    ]);
    assert.ok(rejection);
    assert.equal(rejection.status, 409);
    assert.equal(rejection.error, RETIRED_ITEM_ERROR);
    assert.equal(rejection.error, 'This item is no longer available');
    assert.deepEqual(rejection.retiredProductIds, [
      '3749b41d-ace8-477c-a32e-c50a1961307e',
    ]);
  });

  it('allows a cart with no retired products', () => {
    assert.equal(
      retiredCheckoutRejection([
        { id: 'live', sku: 'KP-PACK-6' },
        { id: 'other', sku: null },
      ]),
      null
    );
    assert.equal(retiredCheckoutRejection([]), null);
  });
});
