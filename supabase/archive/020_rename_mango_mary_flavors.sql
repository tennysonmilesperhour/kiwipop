-- ============================================================================
-- Kiwi Pop — rename two flavors:
--   "Mollie's Mango"  → "Molly's Mint"           (SKU KP-MANGO-MOLLY)
--   "Merry Mint"      → "Merry Caramel Apple"    (SKU KP-MARY-MINT)
-- ----------------------------------------------------------------------------
-- SKUs stay unchanged (KP-MANGO-MOLLY, KP-MARY-MINT, plus the 6/20 pack
-- siblings) so existing order_items, wholesale_pricing, and inventory rows
-- keep their references. Stripe titles will be updated by hand.
-- Idempotent — safe to re-run.
-- ============================================================================

UPDATE public.products
SET name = 'Molly''s Mint',
    description = 'bright peppermint, clean and cold on the back end. the mint that wakes you up without apologizing. coming soon.'
WHERE sku = 'KP-MANGO-MOLLY';

UPDATE public.products
SET name = 'Molly''s Mint · 6-pack · preorder',
    description = 'six molly''s mint pops at $4.17 each. preorder — ships when the batch is ready.'
WHERE sku = 'KP-MANGO-MOLLY-PACK-6';

UPDATE public.products
SET name = 'Molly''s Mint · Party Pack (20) · preorder',
    description = 'twenty molly''s mint pops at $3 each. preorder — the value tier.'
WHERE sku = 'KP-MANGO-MOLLY-PACK-20';

UPDATE public.products
SET name = 'Merry Caramel Apple',
    description = 'warm caramel wrapped around tart green apple, glossy on the lips. autumn in lollipop form. coming soon.'
WHERE sku = 'KP-MARY-MINT';

UPDATE public.products
SET name = 'Merry Caramel Apple · 6-pack · preorder',
    description = 'six merry caramel apple pops at $4.17 each. preorder — ships when the batch is ready.'
WHERE sku = 'KP-MARY-MINT-PACK-6';

UPDATE public.products
SET name = 'Merry Caramel Apple · Party Pack (20) · preorder',
    description = 'twenty merry caramel apple pops at $3 each. preorder — the value tier.'
WHERE sku = 'KP-MARY-MINT-PACK-20';
