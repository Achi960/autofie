
-- 1) Chat-media storage: allow signed-in users to upload to their own folder under <listingId>/<userId>/...
CREATE POLICY "chat-media upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[2] = (auth.uid())::text);

CREATE POLICY "chat-media update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[2] = (auth.uid())::text)
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[2] = (auth.uid())::text);

-- 2) Banned flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_reason text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- Only admins can change ban fields
CREATE OR REPLACE FUNCTION public.enforce_ban_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.is_banned IS DISTINCT FROM OLD.is_banned
      OR NEW.banned_reason IS DISTINCT FROM OLD.banned_reason
      OR NEW.banned_at IS DISTINCT FROM OLD.banned_at)
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can change ban status' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_enforce_ban ON public.profiles;
CREATE TRIGGER trg_profiles_enforce_ban BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_ban_change();

-- Admins can update any profile (needed to ban)
DROP POLICY IF EXISTS "admins update any profile" ON public.profiles;
CREATE POLICY "admins update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Block banned users from sending messages: replace insert policy
DROP POLICY IF EXISTS "users send messages on active listings" ON public.messages;
CREATE POLICY "users send messages on active listings" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_banned)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = messages.receiver_id AND p.is_banned)
  AND (listing_id IS NULL OR EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = messages.listing_id AND (l.status = 'approved'::listing_status OR l.user_id = auth.uid())
  ))
  AND NOT EXISTS (SELECT 1 FROM public.spam_blocks sb WHERE sb.user_id = messages.receiver_id AND sb.blocked_id = auth.uid())
);

-- 3) Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (reported_user_id IS NOT NULL OR listing_id IS NOT NULL),
  CHECK (status IN ('open','reviewing','resolved','dismissed'))
);

GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users create reports" ON public.reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reporter or admin reads" ON public.reports
FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.is_admin(auth.uid()));

CREATE POLICY "admins update reports" ON public.reports
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reports_open ON public.reports (created_at DESC) WHERE status = 'open';

-- Notify admins on new report
CREATE OR REPLACE FUNCTION public.notify_admins_on_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _who text; _what text;
BEGIN
  SELECT COALESCE(full_name, 'A user') INTO _who FROM public.profiles WHERE id = NEW.reporter_id;
  _what := CASE
    WHEN NEW.reported_user_id IS NOT NULL THEN 'a user'
    WHEN NEW.listing_id IS NOT NULL THEN 'a listing'
    ELSE 'something'
  END;
  INSERT INTO public.admin_notifications (title, message, link)
  VALUES (
    'New report',
    _who || ' reported ' || _what || ': ' || NEW.reason,
    '/admin/reports'
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reports_notify ON public.reports;
CREATE TRIGGER trg_reports_notify AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_report();

-- 4) Admin overview RPC
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admins only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT jsonb_build_object(
    'users_total', (SELECT count(*) FROM public.profiles),
    'users_banned', (SELECT count(*) FROM public.profiles WHERE is_banned),
    'dealers_verified', (SELECT count(*) FROM public.user_roles WHERE role = 'dealer_verified'),
    'dealers_pending', (SELECT count(*) FROM public.user_roles WHERE role = 'dealer_pending'),
    'listings_total', (SELECT count(*) FROM public.listings),
    'listings_approved', (SELECT count(*) FROM public.listings WHERE status = 'approved'),
    'listings_pending', (SELECT count(*) FROM public.listings WHERE status = 'pending'),
    'listings_new_7d', (SELECT count(*) FROM public.listings WHERE created_at > now() - interval '7 days'),
    'messages_total', (SELECT count(*) FROM public.messages),
    'messages_7d', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '7 days'),
    'views_total', (SELECT COALESCE(sum(views),0) FROM public.listing_stats),
    'phone_clicks_total', (SELECT COALESCE(sum(phone_clicks),0) FROM public.listing_stats),
    'chat_clicks_total', (SELECT COALESCE(sum(chat_clicks),0) FROM public.listing_stats),
    'reports_open', (SELECT count(*) FROM public.reports WHERE status = 'open'),
    'top_listings', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT l.id, l.title, l.price, l.cover_photo_url, s.views, s.phone_clicks, s.chat_clicks
        FROM public.listing_stats s
        JOIN public.listings l ON l.id = s.listing_id
        ORDER BY s.views DESC NULLS LAST
        LIMIT 10
      ) t
    ),
    'signups_14d', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb) FROM (
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*)::int AS n
        FROM public.profiles
        WHERE created_at > now() - interval '14 days'
        GROUP BY 1 ORDER BY 1
      ) d
    )
  ) INTO result;
  RETURN result;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;
