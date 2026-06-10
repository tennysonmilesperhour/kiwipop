-- 030_coconut_oil_ingredient.sql
--
-- Coconut oil is an ingredient in every flavor (it is the fat base every pop
-- is made on). This migration acknowledges it on the data layer:
--   1. Registers it as a raw material.
--   2. Appends a coconut acknowledgment + tree-nut allergen note to every
--      real pop product's description.
--
-- IMPORTANT: coconut is classified by the FDA as a tree nut, so it is a major
-- food allergen and is disclosed as such across the storefront + legal pages.
--
-- Both statements are idempotent (ON CONFLICT / the not-ilike guard), so this
-- is safe to re-run and matches the data fix already applied to production.
--
-- NOTE: the manufacturing bill_of_materials (per-pop coconut oil grams + unit
-- cost) is intentionally NOT seeded here: it needs the real recipe quantity
-- and tier pricing. Add a bill_of_materials row per flavor once those numbers
-- are confirmed.

insert into public.raw_materials (name, sku, quantity_available, reorder_point)
values ('Coconut oil', 'RM-COCONUT-OIL', 0, 100)
on conflict (sku) do nothing;

update public.products
set description = description || ' every flavor is made on a coconut oil base. contains coconut (a tree nut).'
where description is not null
  and description not ilike '%coconut%'
  and description not ilike 'retired%'
  and sku not ilike '%donation%';
