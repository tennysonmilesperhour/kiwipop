-- ============================================================================
-- Kiwi Pop — track when a shipping label has been printed
-- ----------------------------------------------------------------------------
-- Admins buy labels throughout the day (single, bulk, or "buy all"), then want
-- to print everything they haven't printed yet in one batch. `printed_at` is
-- the flag that drives that queue: NULL = bought but not yet sent to a printer.
-- The "print unprinted labels" action merges every such label into one PDF and
-- stamps printed_at so they don't reprint next time. Auto-printed labels (when
-- the auto-print toggle is on) are stamped at buy time for the same reason.
-- ============================================================================

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;

-- Speeds up the "labels bought but not yet printed" lookup.
CREATE INDEX IF NOT EXISTS idx_shipments_unprinted
  ON public.shipments (created_at)
  WHERE printed_at IS NULL;
