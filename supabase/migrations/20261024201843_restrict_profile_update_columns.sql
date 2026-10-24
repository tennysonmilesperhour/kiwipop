-- Customers may edit their own presentation fields, never authority or balances.
-- Server admin endpoints and rewards RPCs use service_role/owner privileges.
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (id, email, role, created_at, points_balance, display_name, account_type)
  ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (display_name, account_type) ON public.profiles TO authenticated;
