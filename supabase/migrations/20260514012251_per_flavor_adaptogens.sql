-- ============================================================================
-- Kiwi Pop — per-flavor adaptogen descriptions
-- ----------------------------------------------------------------------------
-- Until now every product description for the 4 flavors shared the same
-- functional payload string ("theobromine, ginseng, B12, magnesium, taurine,
-- electrolytes"). The recipe spec (kiwi_pop_costing_v2.xlsx) calls for a
-- different adaptogen in each flavor, while the rest of the functional base
-- stays shared across all of them.
--
--   kiwi pop          → ginseng + spirulina   · balanced
--   lemon g. luci     → ashwagandha           · calm-warming
--   mary caramel apple → maca + cinnamon      · grounded energy
--   molly's mint      → L-theanine + chamomile · calm-focus
--
-- This migration rewrites the in-DB product descriptions for the three
-- preorder flavors (Lucy Lemon / Molly's Mint / Mary Caramel Apple) and
-- their pack SKUs so the storefront, admin views, and Stripe import all
-- read consistent copy. The Kiwi Pop launch SKUs already describe ginseng,
-- so we leave those descriptions in place; only the launch single is
-- refreshed to spell out the shared-base + adaptogen framing.
--
-- Idempotent: re-running just overwrites the description with the same text.
-- ============================================================================

-- Kiwi Pop launch single — spell out the new framing
UPDATE public.products
SET description = 'the launch flavor. bright kiwi, edible mica glitter swirled through the middle. ~35 cal. <1g of sugar. xylitol-sweetened (tooth-friendly, no insulin spike) with a touch of monk fruit on an isomalt base. shared functional base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) + ginseng & spirulina to keep it balanced and bright.'
WHERE sku = 'KP-KIWI-KITTY';

-- Lemon G. Luci → ashwagandha · calm-warming
UPDATE public.products
SET description = 'the g is for ginger. bright lemon out front, ginger snap on the back end — sharper, more awake. freeze-dried lemon and ground ginger riding on the same isomalt base. shared functional base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) with ashwagandha swapped in for a calm-warming direction (ginseng''s bitter edge fights ginger). turmeric for color + warmth. preorder.'
WHERE sku = 'KP-LUCY-LEMON';

UPDATE public.products
SET description = 'six lemon g. luci pops at $4.17 each. preorder — ships when the batch is ready. shared functional base + ashwagandha for calm-warming direction.'
WHERE sku = 'KP-LUCY-LEMON-PACK-6';

UPDATE public.products
SET description = 'twenty lemon g. luci pops at $3 each. preorder — the value tier. shared functional base + ashwagandha for calm-warming direction.'
WHERE sku = 'KP-LUCY-LEMON-PACK-20';

-- Molly's Mint → L-theanine + chamomile · calm-focus
UPDATE public.products
SET description = 'bright peppermint + spearmint, clean and cold on the back end. triple-cooling — mint, jambu, xylitol. shared functional base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) with L-theanine + chamomile tuned for calm-focus rather than alert (ginseng''s earthiness clashes with mint). matcha for natural green color (~3mg caffeine, negligible). preorder.'
WHERE sku = 'KP-MANGO-MOLLY';

UPDATE public.products
SET description = 'six molly''s mint pops at $4.17 each. preorder — ships when the batch is ready. shared functional base + L-theanine + chamomile for calm-focus.'
WHERE sku = 'KP-MANGO-MOLLY-PACK-6';

UPDATE public.products
SET description = 'twenty molly''s mint pops at $3 each. preorder — the value tier. shared functional base + L-theanine + chamomile for calm-focus.'
WHERE sku = 'KP-MANGO-MOLLY-PACK-20';

-- Mary Caramel Apple → maca + cinnamon · grounded energy
UPDATE public.products
SET description = 'warm caramel wrapped around tart green apple, glossy on the lips. autumn in lollipop form. shared functional base (jambu, theobromine, b12, magnesium glycinate, taurine, electrolytes) with maca + cinnamon — maca''s malty backbone reinforces the caramel, cinnamon adds blood-sugar-modulating support that pairs with the magnesium for steady, grounded energy. lucuma for natural butterscotch depth. preorder.'
WHERE sku = 'KP-MARY-MINT';

UPDATE public.products
SET description = 'six mary caramel apple pops at $4.17 each. preorder — ships when the batch is ready. shared functional base + maca + cinnamon for grounded energy.'
WHERE sku = 'KP-MARY-MINT-PACK-6';

UPDATE public.products
SET description = 'twenty mary caramel apple pops at $3 each. preorder — the value tier. shared functional base + maca + cinnamon for grounded energy.'
WHERE sku = 'KP-MARY-MINT-PACK-20';

-- Variety packs — refresh to mention the per-flavor adaptogens
UPDATE public.products
SET description = 'eight pops · 2 of each flavor · shared functional base in all four pops, with a per-flavor adaptogen tuned to direction: kiwi (ginseng + spirulina · balanced) / lemon g. luci (ashwagandha · calm-warming) / molly''s mint (L-theanine + chamomile · calm-focus) / mary caramel apple (maca + cinnamon · grounded energy). preorder.'
WHERE sku = 'KP-VARIETY-PACK-8';

UPDATE public.products
SET description = 'twenty pops · 5 of each flavor · shared functional base in all four pops, with a per-flavor adaptogen tuned to direction: kiwi (ginseng + spirulina · balanced) / lemon g. luci (ashwagandha · calm-warming) / molly''s mint (L-theanine + chamomile · calm-focus) / mary caramel apple (maca + cinnamon · grounded energy). preorder.'
WHERE sku = 'KP-VARIETY-PACK-20';

UPDATE public.products
SET description = 'forty pops · 10 of each flavor · shared functional base in all four pops, with a per-flavor adaptogen tuned to direction: kiwi (ginseng + spirulina · balanced) / lemon g. luci (ashwagandha · calm-warming) / molly''s mint (L-theanine + chamomile · calm-focus) / mary caramel apple (maca + cinnamon · grounded energy). preorder.'
WHERE sku = 'KP-VARIETY-PACK-40';
