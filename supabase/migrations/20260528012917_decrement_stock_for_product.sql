-- ============================================================================
-- Kiwi Pop — atomic stock decrement RPC
-- ----------------------------------------------------------------------------
-- The Stripe webhook (app/api/webhooks/stripe/route.ts) previously did a
-- read-modify-write against `inventory.quantity_available` and never touched
-- `products.in_stock` (the column the storefront actually displays). The
-- update on `inventory` also lacked any error capture, so any failure was
-- silently swallowed — which is why paid orders in production never moved
-- either column.
--
-- This RPC replaces both updates with a single atomic SQL decrement that
-- keeps `inventory.quantity_available` and `products.in_stock` in sync
-- (matching the admin /api/admin/inventory PATCH behavior). It uses
-- GREATEST(0, ...) so we never write negative stock.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.decrement_stock_for_product(
  p_product_id uuid,
  p_quantity int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inventory
  SET quantity_available = GREATEST(0, COALESCE(quantity_available, 0) - p_quantity),
      last_updated = NOW()
  WHERE product_id = p_product_id;

  UPDATE products
  SET in_stock = GREATEST(0, COALESCE(in_stock, 0) - p_quantity)
  WHERE id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_stock_for_product(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_product(uuid, int) TO service_role;
