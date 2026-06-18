-- ============================================================================
-- Kiwi Pop — ingredient-level inventory
-- ----------------------------------------------------------------------------
-- Deduct raw materials from stock on every paid order (expanding packs /
-- variety packs into their component single-pop flavors via the bill of
-- materials), track restocks with weight + cost + reference links, and expose
-- "producible pops per flavor" so we can email admins when any flavor drops
-- below the 50-pop threshold.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Widen raw_materials to hold fractional weights + per-unit cost, and add
--    restock-preset reference fields (a retail/Amazon pack and a wholesale
--    pack, each with a remembered weight + price).
ALTER TABLE public.raw_materials
  ALTER COLUMN quantity_available TYPE numeric USING quantity_available::numeric,
  ALTER COLUMN quantity_reserved  TYPE numeric USING quantity_reserved::numeric,
  ALTER COLUMN reorder_point      TYPE numeric USING reorder_point::numeric;

ALTER TABLE public.raw_materials
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS cost_per_unit_cents numeric,
  ADD COLUMN IF NOT EXISTS reference_url text,
  ADD COLUMN IF NOT EXISTS pack_weight numeric,
  ADD COLUMN IF NOT EXISTS pack_price_cents integer,
  ADD COLUMN IF NOT EXISTS wholesale_url text,
  ADD COLUMN IF NOT EXISTS wholesale_pack_weight numeric,
  ADD COLUMN IF NOT EXISTS wholesale_pack_price_cents integer;

-- Base stock units inferred from the bill of materials (everything else = g).
UPDATE public.raw_materials SET unit = 'ml'
  WHERE sku IN ('RM-WATER','RM-LECITHIN','RM-OIL-LEMON','RM-OIL-MANGO','RM-OIL-PEPPRMNT')
    AND unit <> 'ml';
UPDATE public.raw_materials SET unit = 'ea'
  WHERE sku IN ('RM-STICK','RM-WRAPPER','RM-LABEL')
    AND unit <> 'ea';

-- 2. Restock audit log — one row per "Add pack" / manual restock, with cost.
CREATE TABLE IF NOT EXISTS public.raw_material_restocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity_added numeric NOT NULL,
  unit text NOT NULL,
  cost_cents integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('retail','wholesale','manual')),
  reference_url text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_raw_material_restocks_material
  ON public.raw_material_restocks(raw_material_id);

ALTER TABLE public.raw_material_restocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "raw_material_restocks_admin_all" ON public.raw_material_restocks;
CREATE POLICY "raw_material_restocks_admin_all" ON public.raw_material_restocks
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Pop composition — map every sellable SKU to the single-pop products (and
--    counts) it consumes, so packs and variety packs deduct ingredients too.
CREATE TABLE IF NOT EXISTS public.product_pop_composition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  UNIQUE (product_id, component_product_id)
);
ALTER TABLE public.product_pop_composition ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_pop_composition_read" ON public.product_pop_composition;
CREATE POLICY "product_pop_composition_read" ON public.product_pop_composition
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "product_pop_composition_admin_all" ON public.product_pop_composition;
CREATE POLICY "product_pop_composition_admin_all" ON public.product_pop_composition
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Single pops map to themselves (1:1).
INSERT INTO public.product_pop_composition (product_id, component_product_id, quantity)
SELECT p.id, p.id, 1 FROM public.products p
WHERE p.sku IN ('KP-KIWI-KITTY','KP-LUCY-LEMON','KP-MANGO-MOLLY','KP-MARY-MINT')
ON CONFLICT (product_id, component_product_id) DO NOTHING;

-- Packs + variety packs map to their component flavors.
WITH maps(parent_sku, comp_sku, qty) AS (
  VALUES
    -- base Kiwi Pop packs (the original kiwi flavor)
    ('KP-PACK-3','KP-KIWI-KITTY',3),
    ('KP-PACK-6','KP-KIWI-KITTY',6),
    ('KP-PACK-12','KP-KIWI-KITTY',12),
    ('KP-PACK-20','KP-KIWI-KITTY',20),
    -- single-flavor preorder packs
    ('KP-LUCY-LEMON-PACK-6','KP-LUCY-LEMON',6),
    ('KP-LUCY-LEMON-PACK-20','KP-LUCY-LEMON',20),
    ('KP-MARY-MINT-PACK-6','KP-MARY-MINT',6),
    ('KP-MARY-MINT-PACK-20','KP-MARY-MINT',20),
    ('KP-MANGO-MOLLY-PACK-6','KP-MANGO-MOLLY',6),
    ('KP-MANGO-MOLLY-PACK-20','KP-MANGO-MOLLY',20),
    -- variety packs: equal split across the four flavors
    ('KP-VARIETY-PACK-8','KP-KIWI-KITTY',2),('KP-VARIETY-PACK-8','KP-LUCY-LEMON',2),
    ('KP-VARIETY-PACK-8','KP-MANGO-MOLLY',2),('KP-VARIETY-PACK-8','KP-MARY-MINT',2),
    ('KP-VARIETY-PACK-20','KP-KIWI-KITTY',5),('KP-VARIETY-PACK-20','KP-LUCY-LEMON',5),
    ('KP-VARIETY-PACK-20','KP-MANGO-MOLLY',5),('KP-VARIETY-PACK-20','KP-MARY-MINT',5),
    ('KP-VARIETY-PACK-40','KP-KIWI-KITTY',10),('KP-VARIETY-PACK-40','KP-LUCY-LEMON',10),
    ('KP-VARIETY-PACK-40','KP-MANGO-MOLLY',10),('KP-VARIETY-PACK-40','KP-MARY-MINT',10),
    ('KP-VARIETY-12','KP-KIWI-KITTY',3),('KP-VARIETY-12','KP-LUCY-LEMON',3),
    ('KP-VARIETY-12','KP-MANGO-MOLLY',3),('KP-VARIETY-12','KP-MARY-MINT',3)
)
INSERT INTO public.product_pop_composition (product_id, component_product_id, quantity)
SELECT pp.id, cp.id, m.qty
FROM maps m
JOIN public.products pp ON pp.sku = m.parent_sku
JOIN public.products cp ON cp.sku = m.comp_sku
ON CONFLICT (product_id, component_product_id) DO NOTHING;

-- 4. Consume ingredients for a paid order. Expands each order item to its
--    component pops, then deducts each BOM line from raw_materials in one
--    atomic UPDATE. Never writes negative stock. Idempotency is the caller's
--    responsibility (call once, after the order is marked paid).
CREATE OR REPLACE FUNCTION public.consume_ingredients_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- 5. Restock RPC — add weight, log cost, refresh per-unit cost from the pack.
CREATE OR REPLACE FUNCTION public.restock_raw_material(
  p_material_id uuid,
  p_quantity numeric,
  p_cost_cents integer,
  p_source text,
  p_reference_url text,
  p_actor uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unit text;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be positive';
  END IF;

  SELECT unit INTO v_unit FROM public.raw_materials WHERE id = p_material_id;
  IF v_unit IS NULL THEN
    RAISE EXCEPTION 'raw material not found';
  END IF;

  UPDATE public.raw_materials
  SET quantity_available = quantity_available + p_quantity,
      last_restocked = now(),
      cost_per_unit_cents = CASE
        WHEN p_cost_cents IS NOT NULL AND p_cost_cents > 0 AND p_quantity > 0
          THEN round(p_cost_cents::numeric / p_quantity, 4)
        ELSE cost_per_unit_cents
      END
  WHERE id = p_material_id;

  INSERT INTO public.raw_material_restocks
    (raw_material_id, quantity_added, unit, cost_cents, source, reference_url, created_by)
  VALUES
    (p_material_id, p_quantity, v_unit, COALESCE(p_cost_cents, 0),
     COALESCE(p_source, 'manual'), p_reference_url, p_actor);
END;
$$;
REVOKE ALL ON FUNCTION public.restock_raw_material(uuid, numeric, integer, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restock_raw_material(uuid, numeric, integer, text, text, uuid) TO service_role;

-- 6. Producible pops per flavor: the limiting BOM line decides how many pops
--    of each flavor we can still make from current raw-material stock.
CREATE OR REPLACE FUNCTION public.producible_pops_by_flavor()
RETURNS TABLE(product_id uuid, sku text, name text, producible integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.sku, p.name,
    COALESCE(FLOOR(MIN(
      CASE WHEN bom.quantity_per_unit > 0
        THEN rm.quantity_available / bom.quantity_per_unit
        ELSE NULL END
    ))::int, 0) AS producible
  FROM public.products p
  JOIN public.bill_of_materials bom ON bom.product_id = p.id
  JOIN public.raw_materials rm ON rm.id = bom.raw_material_id
  WHERE p.sku IN ('KP-KIWI-KITTY','KP-LUCY-LEMON','KP-MANGO-MOLLY','KP-MARY-MINT')
  GROUP BY p.id, p.sku, p.name;
$$;
GRANT EXECUTE ON FUNCTION public.producible_pops_by_flavor() TO service_role, authenticated;

-- 7. Low-stock alert state so admins are emailed only on threshold crossings,
--    not on every single order.
CREATE TABLE IF NOT EXISTS public.low_stock_alert_state (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  below_threshold boolean NOT NULL DEFAULT false,
  last_alerted_at timestamptz
);
ALTER TABLE public.low_stock_alert_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "low_stock_alert_state_admin_all" ON public.low_stock_alert_state;
CREATE POLICY "low_stock_alert_state_admin_all" ON public.low_stock_alert_state
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
