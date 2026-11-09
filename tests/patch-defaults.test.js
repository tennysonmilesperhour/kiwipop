const assert = require('node:assert/strict');
const { test } = require('node:test');
const { productCreateSchema, productUpdateSchema, rawMaterialCreateSchema, rawMaterialUpdateSchema } = require('../lib/validators.ts');
const { patchPayload } = require('../lib/patch-payload.ts');

test('product metadata PATCH does not reset stock or preorder mode', () => {
  assert.deepEqual(patchPayload(productUpdateSchema.parse({ name: 'New name' })), { name: 'New name' });
});
test('raw-material metadata PATCH does not reset quantities or reorder point', () => {
  assert.deepEqual(patchPayload(rawMaterialUpdateSchema.parse({ reference_url: 'https://example.com' })), { reference_url: 'https://example.com' });
});
test('empty and unknown-only PATCH bodies contain no database updates', () => {
  for (const schema of [productUpdateSchema, rawMaterialUpdateSchema]) {
    for (const body of [{}, { unknown: true }]) assert.deepEqual(patchPayload(schema.parse(body)), {});
  }
});
test('explicit zero stock and false preorder values survive PATCH', () => {
  const product = { in_stock: 0, preorder_only: false };
  const material = { quantity_available: 0, quantity_reserved: 0, reorder_point: 0 };
  assert.deepEqual(patchPayload(productUpdateSchema.parse(product)), product);
  assert.deepEqual(patchPayload(rawMaterialUpdateSchema.parse(material)), material);
});
test('fractional material stock and clearing nullable fields remain supported', () => {
  assert.deepEqual(patchPayload(rawMaterialUpdateSchema.parse({ quantity_available: 1.5, supplier_id: null, reference_url: '' })), { quantity_available: 1.5, supplier_id: null, reference_url: null });
});
test('creation still supplies defaults', () => {
  const product = productCreateSchema.parse({ name: 'Pop', sku: 'POP', price_cents: 100 });
  assert.equal(product.in_stock, 0);
  assert.equal(product.preorder_only, false);
  const material = rawMaterialCreateSchema.parse({ name: 'Sugar', sku: 'SUGAR' });
  for (const key of ['quantity_available', 'quantity_reserved', 'reorder_point']) assert.equal(material[key], 0);
});
test('PATCH stock validation still rejects invalid values', () => {
  for (const value of [-1, null, '0']) {
    assert.equal(productUpdateSchema.safeParse({ in_stock: value }).success, false);
    assert.equal(rawMaterialUpdateSchema.safeParse({ quantity_available: value }).success, false);
  }
  assert.equal(productUpdateSchema.safeParse({ in_stock: 1.5 }).success, false);
});
