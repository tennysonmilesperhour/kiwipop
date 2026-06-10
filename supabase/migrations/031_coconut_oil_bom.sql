-- 031_coconut_oil_bom.sql
--
-- Add coconut oil to the per-pop bill of materials for every flavor.
-- Recipe yield: 12 g of coconut oil per 54 pops = 0.2222 g per pop.
--
-- Depends on 030_coconut_oil_ingredient.sql (which registers RM-COCONUT-OIL).
-- Idempotent: only inserts a row where one doesn't already exist, so it's
-- safe to re-run and matches the data fix already applied to production.
--
-- NOTE: the cost basis (products.cost_cents) is seeded separately and is not
-- derived from this BOM. Coconut oil at 0.2222 g/pop is a sub-cent material
-- cost; update cost_cents separately if/when you want it reflected there.

insert into public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
select p.id, rm.id, 0.2222, 'g'
from public.products p
cross join public.raw_materials rm
where rm.sku = 'RM-COCONUT-OIL'
  and p.sku in ('KP-KIWI-KITTY', 'KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT')
  and not exists (
    select 1 from public.bill_of_materials b
    where b.product_id = p.id and b.raw_material_id = rm.id
  );
