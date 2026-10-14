const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  HOME_META_DESCRIPTION,
  brandlessProductTitle,
  productPageTitle,
} = require('../lib/product-seo');

describe('product page titles', () => {
  it('drops a leading brand so the title template does not repeat it', () => {
    assert.equal(brandlessProductTitle('Kiwi Pop · 6-pack'), '6-pack');
    const title = productPageTitle('Kiwi Pop · 6-pack');
    assert.equal(title.metadataTitle, '6-pack');
    assert.equal(title.socialTitle, '6-pack · kiwi pop');
  });

  it('uses an absolute title when the product name is only the brand', () => {
    assert.equal(brandlessProductTitle('Kiwi Pop'), '');
    const title = productPageTitle('Kiwi Pop');
    assert.deepEqual(title.metadataTitle, { absolute: 'kiwi pop' });
    assert.equal(title.socialTitle, 'kiwi pop');
  });

  it('keeps flavor names that do not include the brand', () => {
    const title = productPageTitle('Luci Ginger Lemon');
    assert.equal(title.metadataTitle, 'luci ginger lemon');
    assert.equal(title.socialTitle, 'luci ginger lemon · kiwi pop');
  });

  it('strips the brand from both ends and from party packs', () => {
    assert.equal(brandlessProductTitle('kiwi pop · 6-pack · kiwi pop'), '6-pack');
    assert.equal(brandlessProductTitle('Kiwi Pop · Party Pack (20)'), 'party pack (20)');
    assert.equal(
      productPageTitle('Mary Caramel Apple · 6-pack').socialTitle,
      'mary caramel apple · 6-pack · kiwi pop',
    );
  });
});

describe('homepage meta description', () => {
  it('stays inside 150–160 characters and uses existing wording', () => {
    assert.ok(HOME_META_DESCRIPTION.length >= 150);
    assert.ok(HOME_META_DESCRIPTION.length <= 160);
    assert.match(HOME_META_DESCRIPTION, /lollipop shaped party supplements/);
    assert.match(HOME_META_DESCRIPTION, /<1g of sugar, vegan/);
    assert.match(HOME_META_DESCRIPTION, /~35 cal/);
    assert.match(HOME_META_DESCRIPTION, /xylitol-sweetened lollipops with edible mica glitter/);
    assert.match(HOME_META_DESCRIPTION, /candy for people who don't eat candy/);
  });
});
