-- ============================================================================
-- Kiwi Pop — fix flavor spelling:
--   "Merry Caramel Apple" → "Mary Caramel Apple"   (SKU KP-MARY-MINT)
-- ----------------------------------------------------------------------------
-- The cofounder's name is Mary (M-A-R-Y), not Merry. Migration 020 introduced
-- the misspelling on the display name; SKUs were already KP-MARY-*. This patch
-- aligns name + description with the correct spelling. Idempotent.
-- ============================================================================

UPDATE public.products
SET name = 'Mary Caramel Apple'
WHERE sku = 'KP-MARY-MINT';

UPDATE public.products
SET name = 'Mary Caramel Apple · 6-pack · preorder',
    description = 'six mary caramel apple pops at $4.17 each. preorder — ships when the batch is ready.'
WHERE sku = 'KP-MARY-MINT-PACK-6';

UPDATE public.products
SET name = 'Mary Caramel Apple · Party Pack (20) · preorder',
    description = 'twenty mary caramel apple pops at $3 each. preorder — the value tier.'
WHERE sku = 'KP-MARY-MINT-PACK-20';

-- Variety pack descriptions still listed the older "merry mint" placeholder.
-- Rewrite them to reflect the current four flavors so the website + admin
-- never surface "merry" again.
UPDATE public.products
SET description = 'eight pops · 2 of each flavor · kiwi pop / lemon g. luci / molly''s mint / mary caramel apple. preorder — ships when the batch is ready.'
WHERE sku = 'KP-VARIETY-PACK-8';

UPDATE public.products
SET description = 'twenty pops · 5 of each flavor · kiwi pop / lemon g. luci / molly''s mint / mary caramel apple. preorder — ships when the batch is ready.'
WHERE sku = 'KP-VARIETY-PACK-20';

UPDATE public.products
SET description = 'forty pops · 10 of each flavor · kiwi pop / lemon g. luci / molly''s mint / mary caramel apple. preorder — ships when the batch is ready.'
WHERE sku = 'KP-VARIETY-PACK-40';
