-- ============================================================================
-- Seed inventory rows for products that were inserted without one.
-- ----------------------------------------------------------------------------
-- decrement_stock_for_product updates inventory.quantity_available (and
-- last_updated) only when a row already exists, then always updates
-- products.in_stock. Variety packs (KP-VARIETY-PACK-8/20/40) have
-- products.in_stock and no inventory row, so a paid order cannot move
-- inventory.last_updated for them.
--
-- This copies the current products.in_stock into a new inventory row. It does
-- not subtract historical sales. Those sales were missed because reconcile
-- marked orders paid without calling the stock RPC; correct the counts in
-- admin if you want the past units taken out.
--
-- Not applied by this commit.
-- ============================================================================

INSERT INTO public.inventory (
  product_id,
  quantity_available,
  quantity_reserved,
  quantity_preordered
)
SELECT p.id, COALESCE(p.in_stock, 0), 0, 0
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory i WHERE i.product_id = p.id
);
