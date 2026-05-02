-- ============================================================================
-- Kiwi Pop — wholesale inquiries (no-auth contact form)
-- ----------------------------------------------------------------------------
-- The /wholesale/contact form is open to anyone. Submissions land here as a
-- backup of record while POST /api/wholesale/inquire forwards a notification
-- email to the founder. Reads are admin-only via RLS; the public form
-- inserts via the service-role key in the API route, bypassing RLS, so RLS
-- can stay strict without breaking the form.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wholesale_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  location TEXT NOT NULL,
  business_type TEXT,
  looking_to_order TEXT NOT NULL,
  about_business TEXT,
  timeline TEXT,
  source TEXT NOT NULL DEFAULT 'wholesale-contact',
  ip_address INET,
  user_agent TEXT,
  notify_status TEXT NOT NULL DEFAULT 'pending',
  notify_error TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wholesale_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wholesale_inquiries_admin_all" ON public.wholesale_inquiries;
CREATE POLICY "wholesale_inquiries_admin_all" ON public.wholesale_inquiries
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_wholesale_inquiries_created_at
  ON public.wholesale_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wholesale_inquiries_status
  ON public.wholesale_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_wholesale_inquiries_email
  ON public.wholesale_inquiries (contact_email);
