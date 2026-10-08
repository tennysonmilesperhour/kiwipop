-- ============================================================================
-- Kiwi Pop — Stripe Price IDs + retail pack lineup reshape
-- ----------------------------------------------------------------------------
-- Wires three real Stripe Prices (created in the dashboard) into the catalog
-- and reshapes the retail pack lineup from [1, 3, 6, 12] → [1, 6, 20]:
--
--   single   $5  → KP-KIWI-KITTY        (existing) → price_1TSlCzLMKed5UHTWIP6xSoqt
--   6-pack   $25 → KP-PACK-6            (existing) → price_1TSlFCLMKed5UHTWoj4GGmgt
--   20-pack  $60 → KP-PACK-20  (new — "Party Pack") → price_1TSlIDLMKed5UHTWDXJD9FpL
--
-- KP-PACK-3 and KP-PACK-12 are retired (in_stock=0, description='retired')
-- the same way migration 004 retired the placeholder GREEN HOUR / GLOSS /
-- AFTER / STATIC SKUs — keeps existing order_items rows intact.
--
-- The fundraiser variety preorder (KP-VARIETY-PREORDER-HALF) is left alone;
-- it lives in its own flow and isn't part of the retail pack lineup.
--
-- Idempotent via ON CONFLICT (sku).
-- ============================================================================

-- 1. New column on products for Stripe Price IDs. Nullable — preorder SKUs
--    and retired SKUs don't need one; checkout falls back to inline
--    price_data when stripe_price_id is null.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_products_stripe_price_id
  ON public.products(stripe_price_id)
  WHERE stripe_price_id IS NOT NULL;

-- 2. Wire the three real Stripe Prices onto existing/new SKUs.
UPDATE public.products
SET stripe_price_id = 'price_1TSlCzLMKed5UHTWIP6xSoqt',
    price_cents = 500
WHERE sku = 'KP-KIWI-KITTY';

UPDATE public.products
SET stripe_price_id = 'price_1TSlFCLMKed5UHTWoj4GGmgt',
    price_cents = 2500,
    name = 'Kiwi Kitty · 6-pack',
    description = 'six pops at $4.17 each. one good night, or two careful weekends.'
WHERE sku = 'KP-PACK-6';

INSERT INTO public.products (
  name, description, sku, price_cents, stripe_price_id,
  preorder_only, in_stock, image_url
) VALUES (
  'Kiwi Kitty · Party Pack (20)',
  'twenty pops at $3 each. the value tier. share with the floor or hoard them — we''re not your mother.',
  'KP-PACK-20',
  6000,
  'price_1TSlIDLMKed5UHTWDXJD9FpL',
  false,
  120,
  null
)
ON CONFLICT (sku) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      price_cents = EXCLUDED.price_cents,
      stripe_price_id = EXCLUDED.stripe_price_id,
      preorder_only = EXCLUDED.preorder_only,
      in_stock = EXCLUDED.in_stock;

-- 3. Inventory row for KP-PACK-20 (mirrors how migration 004 seeded inventory).
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, quantity_preordered)
SELECT id, in_stock, 0, 0
FROM public.products
WHERE sku = 'KP-PACK-20'
ON CONFLICT (product_id) DO UPDATE
  SET quantity_available = EXCLUDED.quantity_available;

-- 4. Retire KP-PACK-3 and KP-PACK-12. Keep the rows so existing order_items
--    stay valid, but the storefront ignores them (in_stock=0, not preorder).
UPDATE public.products
SET in_stock = 0,
    preorder_only = false,
    description = 'retired'
WHERE sku IN ('KP-PACK-3', 'KP-PACK-12');

UPDATE public.inventory
SET quantity_available = 0,
    quantity_reserved = 0,
    quantity_preordered = 0
WHERE product_id IN (
  SELECT id FROM public.products WHERE sku IN ('KP-PACK-3', 'KP-PACK-12')
);
