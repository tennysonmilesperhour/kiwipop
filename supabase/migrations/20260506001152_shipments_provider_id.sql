-- ============================================================================
-- Kiwi Pop — wire shipments to a 3rd-party provider (ShipStation)
-- ----------------------------------------------------------------------------
-- Adds the columns the admin-side label-buying flow needs to (a) re-fetch a
-- label PDF from the provider on demand and (b) record what the label cost
-- so the financials page can subtract postage from net profit later.
-- ============================================================================

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS provider_shipment_id TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS service_level TEXT,
  ADD COLUMN IF NOT EXISTS rate_cents INTEGER;

CREATE INDEX IF NOT EXISTS idx_shipments_provider_shipment_id
  ON public.shipments (provider, provider_shipment_id);
