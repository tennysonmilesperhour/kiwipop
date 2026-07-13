-- ============================================================================
-- Kiwi Pop — manual raw-material stock adjustments (waste / corrections)
-- ----------------------------------------------------------------------------
-- The ingredients admin could only ADD stock (restock presets + manual add).
-- This adds a signed adjustment so admins can also REMOVE stock — spillage,
-- spoilage, or reconciling to a physical recount — with an audit trail and a
-- free-text reason. Deducts are floored at 0 so stock never goes negative.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Log downward/upward corrections in the same movement table. Allow a new
--    'adjustment' source and a free-text note for the reason (retail/wholesale
--    restocks store a reference_url instead; adjustments store a note).
ALTER TABLE public.raw_material_restocks
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.raw_material_restocks
  DROP CONSTRAINT IF EXISTS raw_material_restocks_source_check;
ALTER TABLE public.raw_material_restocks
  ADD CONSTRAINT raw_material_restocks_source_check
  CHECK (source IN ('retail', 'wholesale', 'manual', 'adjustment'));

-- 2. Adjust stock by a signed delta (negative = remove), floored at 0, logged.
--    Returns the resulting quantity_available so the API can report it back.
CREATE OR REPLACE FUNCTION public.adjust_raw_material_stock(
  p_material_id uuid,
  p_delta numeric,
  p_note text,
  p_actor uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unit text;
  v_new numeric;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'adjustment delta must be non-zero';
  END IF;

  SELECT unit INTO v_unit FROM public.raw_materials WHERE id = p_material_id;
  IF v_unit IS NULL THEN
    RAISE EXCEPTION 'raw material not found';
  END IF;

  UPDATE public.raw_materials
  SET quantity_available = GREATEST(0, quantity_available + p_delta)
  WHERE id = p_material_id
  RETURNING quantity_available INTO v_new;

  -- Audit row. quantity_added is signed; adjustments carry no cost and store
  -- the reason in `note` rather than a reference_url.
  INSERT INTO public.raw_material_restocks
    (raw_material_id, quantity_added, unit, cost_cents, source, reference_url, note, created_by)
  VALUES
    (p_material_id, p_delta, v_unit, 0, 'adjustment', NULL, p_note, p_actor);

  RETURN v_new;
END;
$$;
REVOKE ALL ON FUNCTION public.adjust_raw_material_stock(uuid, numeric, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_raw_material_stock(uuid, numeric, text, uuid) TO service_role;
