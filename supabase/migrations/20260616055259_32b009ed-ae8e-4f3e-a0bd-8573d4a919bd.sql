
-- 1) Revoke sensitive columns from anon on profiles & dealer_profiles
REVOKE SELECT (phone, whatsapp_number, whatsapp_enabled) ON public.profiles FROM anon;
REVOKE SELECT (phone, ghana_card_number, id_front_url, id_back_url, selfie_url) ON public.dealer_profiles FROM anon;

-- Ensure authenticated still has full select
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.dealer_profiles TO authenticated;

-- 2) Tighten follows RLS + add safe helpers for counts/lists
DROP POLICY IF EXISTS "follows readable by authenticated" ON public.follows;
CREATE POLICY "users see own follow rows" ON public.follows
  FOR SELECT TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = dealer_id);

CREATE OR REPLACE FUNCTION public.follower_count(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.follows WHERE dealer_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.following_count(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.follows WHERE follower_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_following(_follower uuid, _dealer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.follows WHERE follower_id = _follower AND dealer_id = _dealer)
$$;

CREATE OR REPLACE FUNCTION public.list_followers(_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.follows f JOIN public.profiles p ON p.id = f.follower_id
  WHERE f.dealer_id = _user_id
  ORDER BY f.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.list_following(_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.follows f JOIN public.profiles p ON p.id = f.dealer_id
  WHERE f.follower_id = _user_id
  ORDER BY f.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.follower_count(uuid), public.following_count(uuid),
  public.is_following(uuid, uuid), public.list_followers(uuid), public.list_following(uuid)
  TO anon, authenticated;

-- 3) Drop overly broad chat-media INSERT policy; path-scoped "chat-media upload own" remains
DROP POLICY IF EXISTS "chat-media insert authenticated" ON storage.objects;
