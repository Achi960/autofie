
-- Lock down all SECURITY DEFINER functions: revoke from public, grant only where needed
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_listing_stat(UUID, TEXT) FROM PUBLIC;

-- has_role / is_admin are referenced by RLS policies; signed-in users need EXECUTE
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- stats RPC is intentionally callable by anyone (view tracking)
GRANT EXECUTE ON FUNCTION public.increment_listing_stat(UUID, TEXT) TO anon, authenticated;

-- update_updated_at_column doesn't need SECURITY DEFINER — switch to INVOKER
ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;
