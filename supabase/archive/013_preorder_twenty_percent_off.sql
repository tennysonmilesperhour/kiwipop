-- ============================================================================
-- Kiwi Pop — preorder variety 12-pack moves from 50% off to 20% off
-- ----------------------------------------------------------------------------
-- The launch-fundraiser variety 12-pack preorder was seeded in migration 008
-- at $24 (half off the $48 retail 12-pack). Marketing is dialing the discount
-- back to 20% off, so $48 * 0.80 = $38.40.
--
-- We keep the existing SKU (KP-VARIETY-PREORDER-HALF) so existing order_items
-- and the storefront's varietyHalfOff lookup stay intact; only price + display
-- copy change. Idempotent — re-running just rewrites the same values.
-- ============================================================================

UPDATE public.products
SET price_cents = 3840,
    name = 'Variety 12-pack · Preorder · 20% Off',
    description = 'limited-time 20% off preorder. four flavors, three pops each, in one box. ships when the full lineup goes live. counts toward the launch fundraiser at full retail value.'
WHERE sku = 'KP-VARIETY-PREORDER-HALF';
