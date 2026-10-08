-- ============================================================================
-- Kiwi Pop — rename "Kiwi Kitty" flavor to "Kiwi Pop"
-- ----------------------------------------------------------------------------
-- The flavor previously displayed as "Kiwi Kitty" is being renamed to share
-- the brand name. SKUs (KP-KIWI-KITTY, KP-PACK-6, KP-PACK-20, etc.) stay
-- unchanged so existing order_items, wholesale_pricing, and inventory rows
-- keep their references.
--
-- This only updates the human-readable `name` + `description` columns on
-- the affected products. Idempotent.
-- ============================================================================

UPDATE public.products
SET name = 'Kiwi Pop'
WHERE sku = 'KP-KIWI-KITTY';

UPDATE public.products
SET name = 'Kiwi Pop · 6-pack',
    description = REPLACE(REPLACE(COALESCE(description, ''), 'Kiwi Kitty', 'Kiwi Pop'), 'kiwi kitty', 'kiwi pop')
WHERE sku = 'KP-PACK-6';

UPDATE public.products
SET name = 'Kiwi Pop · Party Pack (20)',
    description = REPLACE(REPLACE(COALESCE(description, ''), 'Kiwi Kitty', 'Kiwi Pop'), 'kiwi kitty', 'kiwi pop')
WHERE sku = 'KP-PACK-20';

-- Retired bundles — keep the rows valid for historical order_items but
-- update the display text in case anyone re-activates them later.
UPDATE public.products
SET name = REPLACE(name, 'Kiwi Kitty', 'Kiwi Pop')
WHERE sku IN ('KP-PACK-3', 'KP-PACK-12')
  AND name LIKE '%Kiwi Kitty%';
