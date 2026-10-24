const { test } = require('node:test');
const assert = require('node:assert/strict');

test('product uploads decode JPEG and PNG and reject disguised SVG or corrupt bytes', async () => {
  const sharp = require('sharp');
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).jpeg().toBuffer();
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'blue' } }).png().toBuffer();
  const { normalizeProductImage } = await import('../lib/product-image.mjs');
  for (const bytes of [jpeg, png]) {
    const output = await normalizeProductImage(bytes);
    assert.equal((await sharp(output).metadata()).format, 'webp');
  }
  await assert.rejects(normalizeProductImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>')));
  await assert.rejects(normalizeProductImage(Buffer.from('not an image')));
});
