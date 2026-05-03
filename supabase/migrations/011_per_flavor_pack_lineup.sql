-- ============================================================================
-- Kiwi Pop — per-flavor pack lineup + flavor pricing alignment
-- ----------------------------------------------------------------------------
-- 1. Brings the three preorder flavors (Lucy Lemon, Mango Molly, Mary Mint)
--    up to the same single-pop price as Kiwi Kitty: $5.00.
-- 2. Mirrors the [1, 6, 20] pack ladder across all four flavors. Adds six
--    per-flavor pack SKUs (6-pack at $25, 20-pack at $60) so each flavor's
--    /products page can render the same pack tiles. The new pack rows are
--    preorder_only and have no stripe_price_id — checkout falls back to
--    inline price_data via lib/stripe.ts.
--
-- Idempotent via ON CONFLICT (sku).
-- ============================================================================

-- 1. Single-pop price alignment.
UPDATE public.products
SET price_cents = 500
WHERE sku IN ('KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT');

-- 2. Per-flavor pack SKUs.
INSERT INTO public.products (
  name, description, sku, price_cents, stripe_price_id,
  preorder_only, in_stock, image_url
) VALUES
  (
    'Lucy Lemon · 6-pack · preorder',
    'six lucy lemon pops at $4.17 each. preorder — ships when the batch is ready.',
    'KP-LUCY-LEMON-PACK-6',
    2500,
    NULL,
    true,
    200,
    NULL
  ),
  (
    'Lucy Lemon · Party Pack (20) · preorder',
    'twenty lucy lemon pops at $3 each. preorder — the value tier.',
    'KP-LUCY-LEMON-PACK-20',
    6000,
    NULL,
    true,
    200,
    NULL
  ),
  (
    'Mango Molly · 6-pack · preorder',
    'six mango molly pops at $4.17 each. preorder — ships when the batch is ready.',
    'KP-MANGO-MOLLY-PACK-6',
    2500,
    NULL,
    true,
    200,
    NULL
  ),
  (
    'Mango Molly · Party Pack (20) · preorder',
    'twenty mango molly pops at $3 each. preorder — the value tier.',
    'KP-MANGO-MOLLY-PACK-20',
    6000,
    NULL,
    true,
    200,
    NULL
  ),
  (
    'Mary Mint · 6-pack · preorder',
    'six mary mint pops at $4.17 each. preorder — ships when the batch is ready.',
    'KP-MARY-MINT-PACK-6',
    2500,
    NULL,
    true,
    200,
    NULL
  ),
  (
    'Mary Mint · Party Pack (20) · preorder',
    'twenty mary mint pops at $3 each. preorder — the value tier.',
    'KP-MARY-MINT-PACK-20',
    6000,
    NULL,
    true,
    200,
    NULL
  )
ON CONFLICT (sku) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      price_cents = EXCLUDED.price_cents,
      preorder_only = EXCLUDED.preorder_only,
      in_stock = EXCLUDED.in_stock;

-- 3. Inventory rows for the six new pack SKUs.
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, quantity_preordered)
SELECT id, in_stock, 0, 0
FROM public.products
WHERE sku IN (
  'KP-LUCY-LEMON-PACK-6', 'KP-LUCY-LEMON-PACK-20',
  'KP-MANGO-MOLLY-PACK-6', 'KP-MANGO-MOLLY-PACK-20',
  'KP-MARY-MINT-PACK-6', 'KP-MARY-MINT-PACK-20'
)
ON CONFLICT (product_id) DO UPDATE
  SET quantity_available = EXCLUDED.quantity_available;
