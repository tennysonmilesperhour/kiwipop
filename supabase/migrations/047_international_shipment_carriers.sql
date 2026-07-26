-- International labels may be fulfilled by carriers beyond the original
-- USPS/UPS/FedEx set. Keep a constrained normalized value for reporting.
ALTER TABLE public.shipments
  DROP CONSTRAINT IF EXISTS shipments_carrier_check;

ALTER TABLE public.shipments
  ADD CONSTRAINT shipments_carrier_check
  CHECK (carrier IN ('usps', 'ups', 'fedex', 'dhl', 'canadapost', 'other'));
