-- ============================================================================
-- Kiwi Pop — restock presets from the sourcing research dive (2026-06-18)
-- ----------------------------------------------------------------------------
-- Pre-fills each raw material's reference links + a retail (Amazon) and a
-- wholesale pack preset (weight + price), plus an estimated per-unit cost, so
-- the "+ Retail pack" / "+ Wholesale pack" buttons in Admin → Ingredients add
-- stock and log cost in one click.
--
-- IMPORTANT: prices are ESTIMATES from search snippets (live product pages were
-- fetch-blocked during research) — confirm in a browser and correct via the
-- material's Edit drawer. See docs/ingredient-sourcing.md for the full table,
-- $/oz, confidence, and wholesale partners. Weights are grams (sticks/labels
-- are 'ea'). Idempotent: safe to re-run.
-- ============================================================================

UPDATE public.raw_materials rm SET
  reference_url              = src.ref_url,
  pack_weight                = src.pack_w,
  pack_price_cents           = src.pack_pc,
  wholesale_url              = src.wh_url,
  wholesale_pack_weight      = src.wh_w,
  wholesale_pack_price_cents = src.wh_pc,
  cost_per_unit_cents        = COALESCE(src.cost, rm.cost_per_unit_cents)
FROM (VALUES
  ('RM-ISOMALT',     'https://www.amazon.com/CK-Products-Isomalt-Crystals-Pound/dp/B00CRJKA6G',                       NULL::numeric, NULL::integer, 'https://www.webstaurantstore.com/lorann-oils-10-lb-isomalt-crystals/725ISOMALT10.html',                 4535.92, 7449,  1.642),
  ('RM-XYLITOL',     'https://www.amazon.com/BulkSupplements-com-Xylitol-Powder-Substitute-Alternative/dp/B00QT5Z6Q8', 1000,          2397,          'https://www.bakersauthority.com/products/xylitol-55lbs',                                                NULL,    NULL,  2.397),
  ('RM-MONKFRUIT',   'https://www.amazon.com/Bulksupplements-Fruit-Extract-Powder-Kilogram/dp/B01BKXTO5C',            NULL,          NULL,          'https://bulknaturaloils.com/monk-fruit-extract-powder-30-1-kg-2-lbs.html',                              NULL,    NULL,  NULL),
  ('RM-COCONUT-OIL', 'https://www.amazon.com/Nutiva-Organic-Sustainably-Coconuts-1-gallon/dp/B01766NTU8',             NULL,          NULL,          'https://www.amazon.com/Coconut-Oil-Bulk-Naturally-Tasteless/dp/B08H71F3R8',                             NULL,    NULL,  NULL),
  ('RM-LUSTER',      'https://www.amazon.com/edible-mica-powder/s?k=edible+mica+powder',                              NULL,          NULL,          'https://bakell.com/collections/buy-luster-dust-wholesale',                                              NULL,    NULL,  NULL),
  ('RM-ELECTROLYTE', 'https://www.amazon.com/electrolytes-bulk/s?k=electrolytes+bulk',                                NULL,          NULL,          'https://purebulk.com/products/electrolytes-tasty-clear',                                                NULL,    NULL,  NULL),
  ('RM-CITRIC',      'https://www.amazon.com/BulkSupplements-Citric-Crystalline-Powder-Kilogram/dp/B00JV94EMG',       1000,          2297,          'https://shop.proschoice.com/products/5-lbs-citric-acid-anhydrous-granular-high-quality-fcc-usp-grade-100-pure-non-gmo', NULL, NULL, 2.297),
  ('RM-KIWI-PWD',    'https://www.amazon.com/Jungle-Powders-Freeze-Dried-Kiwi-Powder-Smoothie-Baking/dp/B09JB2KTJ2',  99.22,         2190,          'https://www.medikonda.com/products/freeze-dried-kiwi-fruit-powder-suppliers-bulk-wholesale-in-usa',     NULL,    NULL,  22.07),
  ('RM-LEMON-PWD',   'https://www.amazon.com/Organic-Lemon-Powder-1lb-Freeze-Dried/dp/B0CF3RZQCZ',                    453.59,        2599,          'https://wholesale.bulksupplements.com/products/lemon',                                                  25000,   47429, 5.73),
  ('RM-GINGER-PWD',  'https://www.amazon.com/Ingredients-Organic-Aromatic-Cooking-Non-GMO/dp/B08TBBBJK8',             907.18,        2499,          'https://www.starwest-botanicals.com/product/ginger-root-powder-organic/',                               NULL,    NULL,  2.755),
  ('RM-TURMERIC',    'https://www.amazon.com/BULKSUPPLEMENTS-COM-Turmeric-Extract-Powder-Supplements/dp/B00GHY364A',  1000,          12797,         'https://purebulk.com/products/curcumin-95-natural-turmeric-extract',                                    NULL,    NULL,  12.797),
  ('RM-TAURINE',     'https://www.amazon.com/Supplement-Unflavored-Absorbed-Essential-Exercise/dp/B0C88H675D',        1000,          2199,          'https://www.amazon.com/Nutricost-Taurine-Powder-1KG-Servings/dp/B01MQGUFJP',                            1000,    2395,  2.199),
  ('RM-B12',         'https://www.amazon.com/Methyl-Methylcobalamin-Powder-Bulksupplements-Vitamin/dp/B072JXKLSF',    NULL,          NULL,          'https://purebulk.com/products/methylcobalamin',                                                         NULL,    NULL,  NULL),
  ('RM-GINKGO',      'https://www.amazon.com/BulkSupplements-Ginkgo-Biloba-Extract-Powder/dp/B00EMKB9TK',             1000,          3800,          'https://wholesale.bulksupplements.com/products/ginkgo-biloba-leaf-extract-powder',                      NULL,    NULL,  3.8),
  ('RM-STICK',       'https://www.amazon.com/Wilton-6-Inch-Lollipop-Sticks-100-Count/dp/B000W5CGR8',                  NULL,          NULL,          'https://www.webstaurantstore.com/paper-lollipop-cake-pop-stick-6-x-1-8-case/594PSTK613.html',           15000,   13299, 0.8866),
  ('RM-LABEL',       'https://www.amazon.com/1-5-Inch-Round-Labels-Stickers/dp/B083V6LVT2',                           NULL,          NULL,          'https://www.onlinelabels.com/products/ol5375',                                                          200,     787,   3.935),
  ('RM-JAMBU',       NULL,                                                                                            NULL,          NULL,          'https://www.ingredientsonline.com/botanicals/acmella-oleracea-jambu-oleoresin-30-spilanthol/',          NULL,    NULL,  NULL),
  ('RM-THEOBROMINE', 'https://www.amazon.com/Bulksupplements-Theobromine-Powder-1-kilogram/dp/B01LBN3I8U',            1000,          4999,          'https://www.bulksupplements.com/products/theobromine-powder',                                           NULL,    NULL,  4.999),
  ('RM-MAG-GLYC',    'https://www.amazon.com/BulkSupplements-Magnesium-Glycinate-Powder-grams/dp/B00F7OZJQ4',         500,           2297,          'https://wholesale.bulksupplements.com/products/magnesium-glycinate-powder',                             25000,   36565, 4.594),
  ('RM-GINSENG',     'https://www.amazon.com/Bulksupplements-Ginseng-Extract-Powder-grams/dp/B01L0H91BU',            250,           2797,          'https://www.bulksupplements.com/products/ginseng-root-extract-powder',                                  NULL,    NULL,  11.188),
  ('RM-SPIRULINA',   'https://www.amazon.com/Nutricost-Spirulina-Powder-Pounds-Quality/dp/B079NRC661',               907.18,        2995,          'https://www.amazon.com/BulkSupplements-Spirulina-Powder-1-Kilogram/dp/B00ENSGXZQ',                      NULL,    NULL,  3.301),
  ('RM-ASHWA',       'https://www.amazon.com/Ashwagandha-somnifera-Supplement-Adaptogen-Relaxation/dp/B01B6E2UOC',    NULL,          NULL,          'https://nootropicsdepot.com/ksm-66-powder-ashwagandha-extract',                                         NULL,    NULL,  NULL),
  ('RM-MACA',        'https://www.amazon.com/BULKSUPPLEMENTS-COM-Organic-Maca-Powder-1kg/dp/B0CFBJZQSQ',              NULL,          NULL,          'https://www.starwest-botanicals.com/product/maca-root-powder-gelatinized-organic/',                     NULL,    NULL,  NULL),
  ('RM-CINNAMON',    'https://www.amazon.com/Premium-Cinnamon-Naturevibe-Botanicals-Gluten-Free/dp/B071HSW2MY',       453.59,        1499,          'https://www.starwest-botanicals.com/product/cinnamon-powder-ceylon-organic/',                           NULL,    NULL,  3.305),
  ('RM-LTHEANINE',   'https://www.amazon.com/BulkSupplements-L-Theanine-Powder-250-Grams/dp/B00E7GESKG',              250,           2297,          'https://purebulk.com/products/l-theanine',                                                              NULL,    NULL,  9.188),
  ('RM-CHAMOMILE',   'https://www.amazon.com/Chamomile-Extract-Bulksupplements-Natural-Anti-Inflammatory/dp/B07BFFQY5P', 500,        5037,          'https://wholesale.bulksupplements.com/products/chamomile-extract-powder',                               NULL,    NULL,  10.074),
  ('RM-MATCHA',      'https://www.amazon.com/BulkSupplements-Organic-Matcha-Powder-Kilogram/dp/B07N47YBQJ',           1000,          4096,          'https://bulk.matcha.com/products/bulk-culinary-matcha',                                                 1000,    4548,  4.096),
  ('RM-LUCUMA',      'https://www.amazon.com/Organic-Lucuma-Powder-Pounds-Non-Irradiated/dp/B07W1GF6NR',              NULL,          NULL,          'https://dolcesuperfoods.com/products/bulk-organic-lucuma-powder',                                       NULL,    NULL,  NULL)
) AS src(sku, ref_url, pack_w, pack_pc, wh_url, wh_w, wh_pc, cost)
WHERE rm.sku = src.sku;
