-- ============================================================================
-- Kiwi Pop — app_settings (singleton row) for cost & quote math
-- ----------------------------------------------------------------------------
-- Material cost lives on products.cost_cents (migration 024). What's been
-- missing is overhead — at DIY scale, fixed monthly overhead dominates
-- per-unit cost and can flip a wholesale tier from "comfortable" to
-- "under water" before you notice.
--
-- This adds a singleton `app_settings` row that the admin wholesale page
-- can edit live:
--
--   monthly_overhead_cents   — fixed monthly overhead in cents
--                              (default $150 = 15000¢, matches the
--                              "Operating Overhead" section of the
--                              Wholesale Costing & Margin Workbook:
--                              Viktor AI $100 + Claude Pro $50).
--   target_monthly_volume    — assumed monthly units, used to amortize
--                              overhead into a per-unit number. Default
--                              100 matches roughly where we are today.
--
-- A singleton row pattern (PRIMARY KEY enforced to 1) keeps the API simple
-- — no row lookup or id juggling, just "get/patch the row".
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_overhead_cents int NOT NULL DEFAULT 15000,
  target_monthly_volume int NOT NULL DEFAULT 100 CHECK (target_monthly_volume > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS — service role only, read or write. The admin wholesale page hits
-- this through /api/admin endpoints with the service-role client.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
