-- ============================================================================
-- Kiwi Pop — seed raw materials + recipes from costing workbook & link sheets
-- ----------------------------------------------------------------------------
-- Sources: kiwi_pop_costing.xlsx (Google Sheet mirror:
--   https://docs.google.com/spreadsheets/d/1mRgUQAmbUfPNUekJlDBUb29nwUK1GWYfTQUjiCkTt_c )
--
-- 1. Seed raw_materials from the Ingredients tab
-- 2. Seed bill_of_materials from the Recipes tab (links ingredients → flavors)
-- 3. Register Google Sheet embeds in admin_sheets for financials + manufacturing
--
-- Idempotent: safe to re-run.
-- ============================================================================


-- ── 1. RAW MATERIALS (from Ingredients tab, Tier 1 pricing) ─────────────────

INSERT INTO public.raw_materials (name, sku, quantity_available, reorder_point)
VALUES
  ('Isomalt',                                         'RM-ISOMALT',       0, 500),
  ('Water (filtered)',                                'RM-WATER',         0, 0),
  ('Monk fruit',                                      'RM-MONKFRUIT',     0, 454),
  ('Liquid sunflower lecithin',                       'RM-LECITHIN',      0, 118),
  ('LorAnn flavor oil — Lemon',                      'RM-OIL-LEMON',     0, 30),
  ('LorAnn flavor oil — Mango',                      'RM-OIL-MANGO',     0, 30),
  ('LorAnn flavor oil — Peppermint',                  'RM-OIL-PEPPRMNT', 0, 30),
  ('Kiwi Powder',                                     'RM-KIWI-PWD',      0, 30),
  ('Citric acid powder',                              'RM-CITRIC',        0, 227),
  ('B12 (methylcobalamin) powder',                    'RM-B12',           0, 10),
  ('Electrolyte powder — Sacred Eats Keto Recharge',  'RM-ELECTROLYTE',   0, 325),
  ('Xylitol',                                         'RM-XYLITOL',       0, 100),
  ('Edible luster dust',                              'RM-LUSTER',        0, 4),
  ('Taurine powder',                                  'RM-TAURINE',       0, 100),
  ('Ginkgo biloba extract powder',                    'RM-GINKGO',        0, 100),
  ('Turmeric extract powder (95% curcumin)',          'RM-TURMERIC',      0, 100),
  ('Mango powder (freeze-dried)',                     'RM-MANGO-PWD',     0, 100),
  ('Lemon powder (freeze-dried)',                     'RM-LEMON-PWD',     0, 100),
  ('Ginger powder (organic ground)',                  'RM-GINGER-PWD',    0, 113),
  ('Bamboo lollipop sticks',                          'RM-STICK',         0, 100),
  ('Lollipop wrapper / packaging',                    'RM-WRAPPER',       0, 100),
  ('Sticker/label per pop',                           'RM-LABEL',         0, 100)
ON CONFLICT (sku) DO NOTHING;


-- ── 2. BILL OF MATERIALS — Kiwi Pop flavor ─────────────────────────────────

INSERT INTO public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, v.qty, v.unit
FROM public.products p
CROSS JOIN (VALUES
  ('RM-ISOMALT',      15,    'g'),
  ('RM-WATER',         4,    'ml'),
  ('RM-MONKFRUIT',     1.4,  'g'),
  ('RM-LECITHIN',      0.25, 'ml'),
  ('RM-KIWI-PWD',      0.25, 'g'),
  ('RM-CITRIC',        0.25, 'g'),
  ('RM-B12',           0.025,'g'),
  ('RM-ELECTROLYTE',   0.25, 'g'),
  ('RM-XYLITOL',       2,    'g'),
  ('RM-LUSTER',        0.1,  'g'),
  ('RM-TAURINE',       0.15, 'g'),
  ('RM-GINKGO',        0.05, 'g'),
  ('RM-TURMERIC',      0.05, 'g'),
  ('RM-STICK',         1,    'ea'),
  ('RM-WRAPPER',       1,    'ea'),
  ('RM-LABEL',         1,    'ea')
) AS v(rm_sku, qty, unit)
JOIN public.raw_materials rm ON rm.sku = v.rm_sku
WHERE p.sku = 'KP-KIWI-KITTY'
  AND NOT EXISTS (
    SELECT 1 FROM public.bill_of_materials bom
    WHERE bom.product_id = p.id AND bom.raw_material_id = rm.id
  );


-- ── 3. BILL OF MATERIALS — Lucy Lemon flavor ───────────────────────────────

INSERT INTO public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, v.qty, v.unit
FROM public.products p
CROSS JOIN (VALUES
  ('RM-ISOMALT',      15,    'g'),
  ('RM-WATER',         4,    'ml'),
  ('RM-MONKFRUIT',     1.4,  'g'),
  ('RM-LECITHIN',      0.25, 'ml'),
  ('RM-OIL-LEMON',     0.25, 'ml'),
  ('RM-CITRIC',        0.25, 'g'),
  ('RM-B12',           0.025,'g'),
  ('RM-ELECTROLYTE',   0.25, 'g'),
  ('RM-XYLITOL',       2,    'g'),
  ('RM-LUSTER',        0.1,  'g'),
  ('RM-TAURINE',       0.15, 'g'),
  ('RM-GINKGO',        0.05, 'g'),
  ('RM-TURMERIC',      0.05, 'g'),
  ('RM-LEMON-PWD',     0.3,  'g'),
  ('RM-GINGER-PWD',    0.3,  'g'),
  ('RM-STICK',         1,    'ea'),
  ('RM-WRAPPER',       1,    'ea'),
  ('RM-LABEL',         1,    'ea')
) AS v(rm_sku, qty, unit)
JOIN public.raw_materials rm ON rm.sku = v.rm_sku
WHERE p.sku = 'KP-LUCY-LEMON'
  AND NOT EXISTS (
    SELECT 1 FROM public.bill_of_materials bom
    WHERE bom.product_id = p.id AND bom.raw_material_id = rm.id
  );


-- ── 4. BILL OF MATERIALS — Mango Molly flavor ──────────────────────────────

INSERT INTO public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, v.qty, v.unit
FROM public.products p
CROSS JOIN (VALUES
  ('RM-ISOMALT',      15,    'g'),
  ('RM-WATER',         4,    'ml'),
  ('RM-MONKFRUIT',     1.4,  'g'),
  ('RM-LECITHIN',      0.25, 'ml'),
  ('RM-OIL-MANGO',     0.25, 'ml'),
  ('RM-CITRIC',        0.25, 'g'),
  ('RM-B12',           0.025,'g'),
  ('RM-ELECTROLYTE',   0.25, 'g'),
  ('RM-XYLITOL',       2,    'g'),
  ('RM-LUSTER',        0.1,  'g'),
  ('RM-TAURINE',       0.15, 'g'),
  ('RM-GINKGO',        0.05, 'g'),
  ('RM-TURMERIC',      0.05, 'g'),
  ('RM-MANGO-PWD',     0.3,  'g'),
  ('RM-STICK',         1,    'ea'),
  ('RM-WRAPPER',       1,    'ea'),
  ('RM-LABEL',         1,    'ea')
) AS v(rm_sku, qty, unit)
JOIN public.raw_materials rm ON rm.sku = v.rm_sku
WHERE p.sku = 'KP-MANGO-MOLLY'
  AND NOT EXISTS (
    SELECT 1 FROM public.bill_of_materials bom
    WHERE bom.product_id = p.id AND bom.raw_material_id = rm.id
  );


-- ── 5. BILL OF MATERIALS — Mary Mint flavor ────────────────────────────────

INSERT INTO public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, v.qty, v.unit
FROM public.products p
CROSS JOIN (VALUES
  ('RM-ISOMALT',      15,    'g'),
  ('RM-WATER',         4,    'ml'),
  ('RM-MONKFRUIT',     1.4,  'g'),
  ('RM-LECITHIN',      0.25, 'ml'),
  ('RM-OIL-PEPPRMNT',  0.25, 'ml'),
  ('RM-CITRIC',        0.25, 'g'),
  ('RM-B12',           0.025,'g'),
  ('RM-ELECTROLYTE',   0.25, 'g'),
  ('RM-XYLITOL',       2,    'g'),
  ('RM-LUSTER',        0.1,  'g'),
  ('RM-TAURINE',       0.15, 'g'),
  ('RM-GINKGO',        0.05, 'g'),
  ('RM-TURMERIC',      0.05, 'g'),
  ('RM-STICK',         1,    'ea'),
  ('RM-WRAPPER',       1,    'ea'),
  ('RM-LABEL',         1,    'ea')
) AS v(rm_sku, qty, unit)
JOIN public.raw_materials rm ON rm.sku = v.rm_sku
WHERE p.sku = 'KP-MARY-MINT'
  AND NOT EXISTS (
    SELECT 1 FROM public.bill_of_materials bom
    WHERE bom.product_id = p.id AND bom.raw_material_id = rm.id
  );


-- ── 6. ADMIN SHEET EMBEDS ──────────────────────────────────────────────────
-- Google Sheet: Kiwi Pop — Wholesale Costing & Margin Workbook
-- ID: 1mRgUQAmbUfPNUekJlDBUb29nwUK1GWYfTQUjiCkTt_c
--
-- Sheet GIDs:
--   Ingredients       = 0
--   Recipes           = 322423813
--   Wholesale Pricing = 116587641
--   Order Calculator  = 2122251534

INSERT INTO public.admin_sheets (slug, label, embed_url, height_px, position)
VALUES
  (
    'financials',
    'Financials · P&L workbook',
    'https://docs.google.com/spreadsheets/d/1mRgUQAmbUfPNUekJlDBUb29nwUK1GWYfTQUjiCkTt_c/gviz/tq?tqx=out:html&gid=116587641',
    700,
    0
  ),
  (
    'manufacturing',
    'Manufacturing · costing + recipes',
    'https://docs.google.com/spreadsheets/d/1mRgUQAmbUfPNUekJlDBUb29nwUK1GWYfTQUjiCkTt_c/gviz/tq?tqx=out:html&gid=0',
    700,
    1
  )
ON CONFLICT (slug) DO UPDATE SET
  label      = EXCLUDED.label,
  embed_url  = EXCLUDED.embed_url,
  height_px  = EXCLUDED.height_px,
  position   = EXCLUDED.position;
