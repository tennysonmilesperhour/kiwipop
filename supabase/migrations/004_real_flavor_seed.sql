-- ============================================================================
-- Kiwi Pop — real flavor seed (per kiwi_pop_costing.xlsx + shopify_launch_spec.md)
-- ----------------------------------------------------------------------------
-- Replaces the placeholder GREEN HOUR / GLOSS / AFTER / STATIC seed from
-- migration 003. The four real production flavors (Kiwi Kitty / Lucy Lemon /
-- Mango Molly / Mary Mint) plus three multi-pack bundles ($5/$12/$24/$48 per
-- shopify_launch_spec.md). Idempotent.
-- ============================================================================

-- 1. Retire the old placeholder SKUs if they exist. We don't delete them
--    because they may have order_items referencing them — instead, mark
--    out of stock and not preorder so the storefront ignores them.
UPDATE public.products
SET in_stock = 0,
    preorder_only = false,
    description = 'retired'
WHERE sku IN ('KP-GREEN-HOUR', 'KP-GLOSS', 'KP-AFTER', 'KP-STATIC');

-- 2. Insert the four real flavors. Kiwi Kitty is live; the other three are
--    preorder-only with stock 0 (per the launch spec's "coming soon" pattern).
INSERT INTO public.products (
  name, description, sku, price_cents,
  preorder_only, preorder_deadline, in_stock, image_url
) VALUES
  (
    'Kiwi Kitty',
    'the launch flavor. bright kiwi, real pop rocks crystals snapping inside, edible mica glitter swirled through the middle. five calories. sweetened with monk fruit and allulose. a little secret in your mouth.',
    'KP-KIWI-KITTY',
    500,
    false,
    null,
    800,
    null
  ),
  (
    'Lucy Lemon',
    'lemon meets ginger. sharper, more awake. freeze-dried lemon and ground ginger riding on the same isomalt base. coming soon.',
    'KP-LUCY-LEMON',
    500,
    true,
    null,
    0,
    null
  ),
  (
    'Mango Molly',
    'ripe mango, glossy on the lips. freeze-dried mango powder cut with the LorAnn oil for full saturation. coming soon.',
    'KP-MANGO-MOLLY',
    500,
    true,
    null,
    0,
    null
  ),
  (
    'Mary Mint',
    'cold peppermint, no sweetness on the back end. the mint that doesn''t apologize. coming soon.',
    'KP-MARY-MINT',
    500,
    true,
    null,
    0,
    null
  )
ON CONFLICT (sku) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      price_cents = EXCLUDED.price_cents,
      preorder_only = EXCLUDED.preorder_only,
      in_stock = EXCLUDED.in_stock;

-- 3. Three multi-pack bundle products at the launch-spec price points.
--    Bundles ship the same lollipops; the difference is just count + price.
INSERT INTO public.products (
  name, description, sku, price_cents,
  preorder_only, in_stock, image_url
) VALUES
  (
    'Kiwi Kitty · 3-pack',
    'three pops · the starter. mix-and-match if you ask in the order notes; otherwise three of the launch flavor.',
    'KP-PACK-3',
    1200,
    false,
    400,
    null
  ),
  (
    'Kiwi Kitty · 6-pack',
    'six pops. one good night, or two careful weekends.',
    'KP-PACK-6',
    2400,
    false,
    250,
    null
  ),
  (
    'Kiwi Kitty · 12-pack',
    'twelve pops. ships free. the value play. share or don''t — we''re not your mother.',
    'KP-PACK-12',
    4800,
    false,
    150,
    null
  )
ON CONFLICT (sku) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      price_cents = EXCLUDED.price_cents,
      in_stock = EXCLUDED.in_stock;

-- 4. Inventory rows for everything new.
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, quantity_preordered)
SELECT id, in_stock, 0, 0
FROM public.products
WHERE sku IN (
  'KP-KIWI-KITTY', 'KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT',
  'KP-PACK-3', 'KP-PACK-6', 'KP-PACK-12'
)
ON CONFLICT (product_id) DO UPDATE
  SET quantity_available = EXCLUDED.quantity_available;
