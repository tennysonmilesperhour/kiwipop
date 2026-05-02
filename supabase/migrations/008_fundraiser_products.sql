-- ============================================================================
-- Kiwi Pop — fundraiser products + half-off variety preorder
-- ----------------------------------------------------------------------------
-- Adds two products to the catalog so the homepage fundraiser bar's CTAs
-- (donate / half-off variety preorder) feed the existing /cart -> /checkout
-- -> Stripe flow without any new payment plumbing:
--
--   * KP-DONATION-1USD - $1/unit donation; quantity = dollars contributed.
--     in_stock is a sentinel large value so the checkout stock guard never
--     blocks a donation.
--   * KP-VARIETY-PREORDER-HALF - $24 variety 12-pack preorder, half of the
--     standard $48 KP-PACK-12 price. preorder_only=true.
--
-- Both contribute to the live $5,000 fundraiser total computed from paid
-- orders (see lib/fundraiser.ts). Idempotent via ON CONFLICT (sku).
-- ============================================================================

INSERT INTO public.products (
  name, description, sku, price_cents,
  preorder_only, in_stock, image_url
) VALUES
  (
    'Kiwi Pop · Donation',
    'one-dollar increments. every dollar feeds the $5,000 launch fundraiser. quantity = dollars contributed. no goods shipped — this is a tip jar.',
    'KP-DONATION-1USD',
    100,
    false,
    1000000,
    null
  ),
  (
    'Variety 12-pack · Preorder · Half Off',
    'limited-time half-off preorder. four flavors, three pops each, in one box. ships when the full lineup goes live. counts toward the launch fundraiser at full retail value.',
    'KP-VARIETY-PREORDER-HALF',
    2400,
    true,
    500,
    null
  )
ON CONFLICT (sku) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      price_cents = EXCLUDED.price_cents,
      preorder_only = EXCLUDED.preorder_only,
      in_stock = EXCLUDED.in_stock;

-- Inventory rows so the admin dashboard's stock view doesn't show holes.
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, quantity_preordered)
SELECT id, in_stock, 0, 0
FROM public.products
WHERE sku IN ('KP-DONATION-1USD', 'KP-VARIETY-PREORDER-HALF')
ON CONFLICT (product_id) DO UPDATE
  SET quantity_available = EXCLUDED.quantity_available;
