-- Compliance copy: product descriptions only. Prices, checkout, and tax
-- codes are untouched. Storefront product pages and Product JSON-LD prefer
-- products.description over the code fallback in lib/flavors.ts.

UPDATE products
SET description = 'the launch flavor. bright kiwi, edible mica glitter swirled through the middle. ~35 cal. <1g of sugar. xylitol-sweetened, with a touch of monk fruit, on an isomalt base. shared base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) plus ginseng and spirulina. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-KIWI-KITTY';

UPDATE products
SET description = 'the g is for ginger. bright lemon out front, ginger snap on the back end. freeze-dried lemon and ground ginger riding on the same isomalt base. shared base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) with ashwagandha in this flavor (ginseng''s bitter edge fights ginger). turmeric for color. preorder. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-LUCY-LEMON';

UPDATE products
SET description = 'six luci ginger lemon pops at $4.17 each. preorder — ships when the batch is ready. shared base + ashwagandha. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-LUCY-LEMON-PACK-6';

UPDATE products
SET description = 'twenty luci ginger lemon pops at $3 each. preorder — the value tier. shared base + ashwagandha. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-LUCY-LEMON-PACK-20';

UPDATE products
SET description = 'bright peppermint + spearmint, clean and cold on the back end. mint, jambu, and xylitol. shared base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) with L-theanine and chamomile in this flavor. matcha for natural green color (about 3 mg caffeine from the matcha). preorder. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-MANGO-MOLLY';

UPDATE products
SET description = 'six molly matcha mint pops at $4.17 each. preorder — ships when the batch is ready. shared base + L-theanine and chamomile. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-MANGO-MOLLY-PACK-6';

UPDATE products
SET description = 'twenty molly matcha mint pops at $3 each. preorder — the value tier. shared base + L-theanine and chamomile. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-MANGO-MOLLY-PACK-20';

UPDATE products
SET description = 'warm caramel wrapped around tart green apple, glossy on the lips. autumn in lollipop form. shared base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) with maca and cinnamon. maca''s malty taste sits with the caramel. lucuma for natural butterscotch depth. preorder. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-MARY-MINT';

UPDATE products
SET description = 'six mary caramel apple cinn pops at $4.17 each. preorder — ships when the batch is ready. shared base + maca and cinnamon. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-MARY-MINT-PACK-6';

UPDATE products
SET description = 'twenty mary caramel apple cinn pops at $3 each. preorder — the value tier. shared base + maca and cinnamon. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-MARY-MINT-PACK-20';

UPDATE products
SET description = 'eight pops · 2 of each flavor · shared base in all four pops, with one ingredient per flavor: kiwi (ginseng + spirulina) / luci ginger lemon (ashwagandha) / molly matcha mint (L-theanine + chamomile) / mary caramel apple cinn (maca + cinnamon). preorder. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-VARIETY-PACK-8';

UPDATE products
SET description = 'twenty pops · 5 of each flavor · shared base in all four pops, with one ingredient per flavor: kiwi (ginseng + spirulina) / luci ginger lemon (ashwagandha) / molly matcha mint (L-theanine + chamomile) / mary caramel apple cinn (maca + cinnamon). preorder. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-VARIETY-PACK-20';

UPDATE products
SET description = 'forty pops · 10 of each flavor · shared base in all four pops, with one ingredient per flavor: kiwi (ginseng + spirulina) / luci ginger lemon (ashwagandha) / molly matcha mint (L-theanine + chamomile) / mary caramel apple cinn (maca + cinnamon). preorder. every flavor is made on a coconut oil base. contains coconut (a tree nut).'
WHERE sku = 'KP-VARIETY-PACK-40';
