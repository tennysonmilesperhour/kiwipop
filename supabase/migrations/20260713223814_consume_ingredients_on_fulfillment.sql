-- ============================================================================
-- Kiwi Pop — deduct ingredients when an order is FULFILLED, not when it's paid
-- ----------------------------------------------------------------------------
-- Previously `consume_ingredients_for_order` was called from the Stripe webhook
-- the moment an order became `paid` (i.e. when it entered the "to fulfill"
-- queue). Admins expected the raw-material deduction to happen when they mark
-- an order shipped/completed ("fulfilled"). This migration moves the trigger to
-- the fulfillment step and makes the deduction idempotent so re-clicking a
-- status (or the paid → shipped → completed progression) can never
-- double-deduct.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Guard column: records when raw materials were deducted for an order. NULL
--    means "not yet consumed". The consume function claims this atomically so
--    only the first caller actually deducts.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ingredients_consumed_at timestamptz;

-- 2. Idempotent consume: claim the order (flip NULL -> now()) before deducting.
--    Any subsequent call for the same order is a no-op. Math is unchanged:
--    expand each line item to its component pops, join the bill of materials,
--    sum order_qty * pops_per_unit * ingredient_per_pop per raw material, and
--    subtract from stock (floored at 0 so it never goes negative).
CREATE OR REPLACE FUNCTION public.consume_ingredients_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Claim the order: only the caller that flips NULL -> now() proceeds.
  UPDATE public.orders
    SET ingredients_consumed_at = now()
    WHERE id = p_order_id
      AND ingredients_consumed_at IS NULL;

  IF NOT FOUND THEN
    -- Already consumed (or order doesn't exist) — deduct nothing.
    RETURN;
  END IF;

  UPDATE public.raw_materials rm
  SET quantity_available = GREATEST(0, rm.quantity_available - usage.total_qty),
      last_restocked = rm.last_restocked
  FROM (
    SELECT bom.raw_material_id,
           SUM(oi.quantity * comp.quantity * bom.quantity_per_unit) AS total_qty
    FROM public.order_items oi
    JOIN public.product_pop_composition comp ON comp.product_id = oi.product_id
    JOIN public.bill_of_materials bom ON bom.product_id = comp.component_product_id
    WHERE oi.order_id = p_order_id
    GROUP BY bom.raw_material_id
  ) usage
  WHERE rm.id = usage.raw_material_id;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ingredients_for_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ingredients_for_order(uuid) TO service_role;

-- 3. Cutover backfill: every order that already reached paid/shipped/completed
--    had its ingredients deducted under the old payment-time trigger. Stamp the
--    guard so the new fulfillment trigger can't double-deduct them. New orders
--    (paid from here on) keep a NULL guard until they're marked fulfilled.
UPDATE public.orders
  SET ingredients_consumed_at = COALESCE(updated_at, created_at, now())
  WHERE ingredients_consumed_at IS NULL
    AND status IN ('paid', 'shipped', 'completed');
