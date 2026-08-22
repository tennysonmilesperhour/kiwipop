-- ============================================================================
-- Kiwi Pop — site-wide "preorder only" mode
-- ----------------------------------------------------------------------------
-- When drop 001 sells through, we don't want the storefront to keep offering
-- "buy now / in stock" — every SKU should flip to preorder in one move,
-- without having to zero out each product's `in_stock` count by hand (the
-- counts are still useful for production planning).
--
-- This adds a single boolean to the `app_settings` singleton. When it's ON:
--   * the storefront presents everything as preorder (badges, copy, CTAs),
--   * the checkout API treats every line as a preorder and skips the
--     out-of-stock guard, and
--   * order_items land with is_preorder = true.
--
-- It's a plain toggle — flip it back OFF from Admin → Products the moment the
-- next batch is in hand and normal sales resume. Column defaults to false so
-- a fresh database starts in normal-sales mode.
-- ============================================================================

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS preorder_only_mode boolean NOT NULL DEFAULT false;

-- Drop 001 is out of stock — turn on preorder-only mode for the live store.
UPDATE app_settings
  SET preorder_only_mode = true,
      updated_at = now()
  WHERE id = 1;
