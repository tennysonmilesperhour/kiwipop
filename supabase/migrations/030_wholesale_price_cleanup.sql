-- 030_wholesale_price_cleanup.sql
-- Clean up wholesale tier pricing to round quarter-dollar points that nudge
-- toward keystone (50% of the $5.00 SRP) while still leaving retailers a
-- generous 55-60% margin.
--
--   standard (50+ units):  $2.00 -> $2.25   (retailer margin 55%)
--   premium  (200+ units): $1.65 -> $2.00   (retailer margin 60%, clean number)
--
-- The public line sheet (/wholesale/line-sheet) and the account page both read
-- live from wholesale_pricing, so they pick these up automatically. Applies to
-- the four wholesale flavor SKUs only.

update wholesale_pricing w
set price_cents = 225
from products p
where w.product_id = p.id
  and w.tier = 'standard'
  and p.sku in ('KP-KIWI-KITTY', 'KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT');

update wholesale_pricing w
set price_cents = 200
from products p
where w.product_id = p.id
  and w.tier = 'premium'
  and p.sku in ('KP-KIWI-KITTY', 'KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT');
