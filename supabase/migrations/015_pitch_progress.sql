-- ============================================================================
-- Kiwi Pop — pitch deck progress state
-- ----------------------------------------------------------------------------
-- Persists per-line "is it done?" + per-milestone status across the two
-- pitch plans (seed-5k / seed-50k) so /admin/pitch becomes a working
-- document the founder can update from any device.
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pitch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL,
  item_kind TEXT NOT NULL CHECK (item_kind IN ('budget', 'milestone')),
  item_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pitch_progress_uniq'
  ) THEN
    ALTER TABLE public.pitch_progress
      ADD CONSTRAINT pitch_progress_uniq UNIQUE (plan_id, item_kind, item_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pitch_progress_plan
  ON public.pitch_progress (plan_id);

ALTER TABLE public.pitch_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pitch_progress_admin_all" ON public.pitch_progress;
CREATE POLICY "pitch_progress_admin_all" ON public.pitch_progress
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
