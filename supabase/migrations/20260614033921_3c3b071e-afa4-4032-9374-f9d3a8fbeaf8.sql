
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _first text := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'first_name','')), '');
  _last  text := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'last_name','')), '');
  _full  text := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name','')), '');
  _phone text := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone','')), '');
BEGIN
  IF _full IS NULL AND (_first IS NOT NULL OR _last IS NOT NULL) THEN
    _full := trim(concat_ws(' ', _first, _last));
  END IF;

  INSERT INTO public.profiles (id, phone, full_name, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.phone, _phone), COALESCE(_full, ''), _first, _last)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
