-- ============================================================================
-- Kiwi Pop — store the label PDF blob on the shipment row
-- ----------------------------------------------------------------------------
-- ShipStation's V1 API has no "re-fetch label by shipmentId" endpoint (that
-- exists only in their V2 API). The original design assumed an on-demand
-- /shipments/getlabel re-fetch, which 404s. Instead we persist the base64 PDF
-- that /shipments/createlabel already hands back, and serve it from here.
-- ~50KB per label — cheap, and it removes the dependency on a non-existent
-- endpoint.
-- ============================================================================

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS label_pdf_base64 TEXT;
