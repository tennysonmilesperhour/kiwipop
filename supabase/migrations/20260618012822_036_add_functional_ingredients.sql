-- ============================================================================
-- Kiwi Pop — add the functional payload + per-flavor adaptogens to inventory
-- ----------------------------------------------------------------------------
-- The storefront advertises a functional base (jambu, theobromine, magnesium
-- glycinate, …) plus a per-flavor adaptogen, but several of these ingredients
-- were never entered as raw materials, so the bill of materials (and the
-- producible-pops / cost math built on it) was incomplete. This migration adds
-- the missing materials and wires them into each flavor's BOM.
--
-- Per-pop doses: theobromine (175 mg) and magnesium glycinate (300 mg) are the
-- amounts stated on the website. The adaptogen / color / depth doses
-- (ginseng, spirulina, ashwagandha, maca, cinnamon, L-theanine, chamomile,
-- matcha, lucuma, jambu) are reasonable ESTIMATES pending formulation sign-off
-- — adjust quantity_per_unit in bill_of_materials if the recipe differs.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. New raw materials (all grams; not yet stocked).
INSERT INTO public.raw_materials (name, sku, unit, quantity_available, reorder_point)
VALUES
  ('Jambu (acmella oleracea) extract', 'RM-JAMBU',       'g', 0, 5),
  ('Theobromine powder',               'RM-THEOBROMINE', 'g', 0, 175),
  ('Magnesium glycinate powder',       'RM-MAG-GLYC',    'g', 0, 300),
  ('Panax ginseng extract powder',     'RM-GINSENG',     'g', 0, 50),
  ('Spirulina powder',                 'RM-SPIRULINA',   'g', 0, 50),
  ('Ashwagandha extract (KSM-66)',     'RM-ASHWA',       'g', 0, 100),
  ('Maca powder',                      'RM-MACA',        'g', 0, 100),
  ('Ceylon cinnamon powder',           'RM-CINNAMON',    'g', 0, 50),
  ('L-theanine powder',                'RM-LTHEANINE',   'g', 0, 50),
  ('Chamomile extract powder',         'RM-CHAMOMILE',   'g', 0, 50),
  ('Matcha powder (culinary)',         'RM-MATCHA',      'g', 0, 100),
  ('Lucuma powder',                    'RM-LUCUMA',      'g', 0, 100)
ON CONFLICT (sku) DO NOTHING;

-- 2. Bill-of-materials lines. (flavor_sku, material_sku, grams-per-pop)
WITH maps(flavor_sku, material_sku, qty) AS (
  VALUES
    -- shared functional base (every flavor)
    ('KP-KIWI-KITTY','RM-JAMBU',0.005),('KP-KIWI-KITTY','RM-THEOBROMINE',0.175),('KP-KIWI-KITTY','RM-MAG-GLYC',0.3),
    ('KP-LUCY-LEMON','RM-JAMBU',0.005),('KP-LUCY-LEMON','RM-THEOBROMINE',0.175),('KP-LUCY-LEMON','RM-MAG-GLYC',0.3),
    ('KP-MANGO-MOLLY','RM-JAMBU',0.005),('KP-MANGO-MOLLY','RM-THEOBROMINE',0.175),('KP-MANGO-MOLLY','RM-MAG-GLYC',0.3),
    ('KP-MARY-MINT','RM-JAMBU',0.005),('KP-MARY-MINT','RM-THEOBROMINE',0.175),('KP-MARY-MINT','RM-MAG-GLYC',0.3),
    -- kiwi pop: ginseng + spirulina
    ('KP-KIWI-KITTY','RM-GINSENG',0.05),('KP-KIWI-KITTY','RM-SPIRULINA',0.05),
    -- luci ginger lemon: ashwagandha
    ('KP-LUCY-LEMON','RM-ASHWA',0.1),
    -- molly matcha mint: L-theanine + chamomile + matcha (natural color)
    ('KP-MANGO-MOLLY','RM-LTHEANINE',0.05),('KP-MANGO-MOLLY','RM-CHAMOMILE',0.05),('KP-MANGO-MOLLY','RM-MATCHA',0.1),
    -- mary caramel apple cinn: maca + cinnamon + lucuma
    ('KP-MARY-MINT','RM-MACA',0.1),('KP-MARY-MINT','RM-CINNAMON',0.05),('KP-MARY-MINT','RM-LUCUMA',0.1)
)
INSERT INTO public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, m.qty, 'g'
FROM maps m
JOIN public.products p ON p.sku = m.flavor_sku
JOIN public.raw_materials rm ON rm.sku = m.material_sku
WHERE NOT EXISTS (
  SELECT 1 FROM public.bill_of_materials b
  WHERE b.product_id = p.id AND b.raw_material_id = rm.id
);
