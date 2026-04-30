-- ============================================================================
-- Kiwi Pop — admin_sheets (Google Sheets embeds inside admin pages)
-- ----------------------------------------------------------------------------
-- Stores the "publish to web" embed URL for each admin section that wants a
-- linked spreadsheet (financials, manufacturing, inventory, wholesale, …).
-- The SheetEmbed component looks up by slug and renders the iframe.
--
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_sheets (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  height_px INTEGER NOT NULL DEFAULT 700,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_sheets_admin_all" ON public.admin_sheets;
CREATE POLICY "admin_sheets_admin_all" ON public.admin_sheets
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Touch updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION public.touch_admin_sheets_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_sheets_touch_updated_at ON public.admin_sheets;
CREATE TRIGGER admin_sheets_touch_updated_at
  BEFORE UPDATE ON public.admin_sheets
  FOR EACH ROW EXECUTE FUNCTION public.touch_admin_sheets_updated_at();
