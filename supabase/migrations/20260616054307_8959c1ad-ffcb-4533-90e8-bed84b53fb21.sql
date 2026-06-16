
CREATE OR REPLACE FUNCTION public.find_user_by_identifier(_identifier text)
RETURNS TABLE(user_id uuid, email text, phone text, full_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _norm text := lower(trim(_identifier));
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admins only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF _norm IS NULL OR _norm = '' THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.phone::text, p.full_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE lower(u.email) = _norm OR u.phone = _identifier OR u.phone = regexp_replace(_identifier, '\D', '', 'g')
    LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_user_by_identifier(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(user_id uuid, email text, phone text, full_name text, granted_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admins only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.phone::text, p.full_name, ur.created_at
    FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin'
    ORDER BY ur.created_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;
