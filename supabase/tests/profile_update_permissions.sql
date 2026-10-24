-- No customer rows are read or changed. Verify the API role's actual permissions.
BEGIN;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE false;
    RAISE EXCEPTION 'role update must be denied';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.profiles SET points_balance = 999999 WHERE false;
    RAISE EXCEPTION 'balance update must be denied';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.profiles SET display_name = 'test' WHERE false;
END $$;
ROLLBACK;
