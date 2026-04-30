-- ============================================================================
-- Kiwi Pop — admin email allowlist + grant owner
-- ----------------------------------------------------------------------------
-- Grants admin role to tennysontaggart@gmail.com whether they've signed up
-- yet or not. Future signups whose email is in the allowlist auto-promote
-- via the on_auth_user_created trigger.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Allowlist table. Owner of the table is admin-only via RLS.
CREATE TABLE IF NOT EXISTS public.admin_email_allowlist (
  email TEXT PRIMARY KEY,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_email_allowlist_admin_all" ON public.admin_email_allowlist;
CREATE POLICY "admin_email_allowlist_admin_all" ON public.admin_email_allowlist
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. Seed the project owner.
INSERT INTO public.admin_email_allowlist (email, note)
VALUES ('tennysontaggart@gmail.com', 'project owner')
ON CONFLICT (email) DO NOTHING;

-- 3. Replace the auth-user-created trigger so allow-listed emails come up
--    as admin, everyone else as customer. Profile auto-create still happens.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_role TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.admin_email_allowlist
    WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    resolved_role := 'admin';
  ELSE
    resolved_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(NEW.email, '@', 1)
    ),
    resolved_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Promote any existing profile whose email is in the allowlist.
--    Handles the case where the user already signed up before this migration.
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) IN (
  SELECT LOWER(email) FROM public.admin_email_allowlist
)
AND role <> 'admin';
