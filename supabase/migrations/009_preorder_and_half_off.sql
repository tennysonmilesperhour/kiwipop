-- ============================================================================
-- Kiwi Pop — preorder mode + $3 PPL + half-off bigger packs
-- ----------------------------------------------------------------------------
-- Founder direction during the launch fundraiser:
--
--   * price-per-lolli (PPL) drops to $3 across every flavor
--   * everything ships as preorder until the goal hits, including the
--     previously-live KP-KIWI-KITTY single
--   * 6-pack and 12-pack get a 50% fundraiser discount
--   * 1-pack and 3-pack stay at full PPL ($3 / $9) so the bigger bundles
--     are clearly the better value
--   * the dedicated KP-VARIETY-PREORDER-HALF SKU follows the new variety
--     12-pack math (12 × $3 / 2 = $18)
--
-- All updates are idempotent (UPDATE on a known SKU set).
-- ============================================================================

-- 1. Single-pop flavor SKUs: $3 each, all preorder.
UPDATE public.products
SET price_cents = 300,
    preorder_only = true
WHERE sku IN (
  'KP-KIWI-KITTY',
  'KP-LUCY-LEMON',
  'KP-MANGO-MOLLY',
  'KP-MARY-MINT'
);

-- 2. 3-pack stays at full PPL: 3 × $3 = $9.
UPDATE public.products
SET price_cents = 900,
    preorder_only = true
WHERE sku = 'KP-PACK-3';

-- 3. 6-pack half off: (6 × $3) / 2 = $9.
UPDATE public.products
SET price_cents = 900,
    preorder_only = true
WHERE sku = 'KP-PACK-6';

-- 4. 12-pack half off: (12 × $3) / 2 = $18.
UPDATE public.products
SET price_cents = 1800,
    preorder_only = true
WHERE sku = 'KP-PACK-12';

-- 5. Variety 12-pack half off matches the new math.
UPDATE public.products
SET price_cents = 1800,
    preorder_only = true
WHERE sku = 'KP-VARIETY-PREORDER-HALF';

-- 6. Catch-all: every other KP-prefixed catalog product (legacy SKUs the
--    storefront may still surface) flips to preorder during the fundraiser.
--    Donation SKU is excluded because "preorder" doesn't apply to a tip jar.
UPDATE public.products
SET preorder_only = true
WHERE sku LIKE 'KP-%'
  AND sku <> 'KP-DONATION-1USD'
  AND preorder_only = false;
