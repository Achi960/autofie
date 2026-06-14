
-- user_notifications table
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'favorite' | 'follow' | 'review' | 'admin' | 'system'
  title text NOT NULL,
  message text NOT NULL,
  link text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own notifications"
  ON public.user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users update own notifications"
  ON public.user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own notifications"
  ON public.user_notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins insert any notification"
  ON public.user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_user_notifications_user_unread
  ON public.user_notifications (user_id, read, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Trigger: someone saves your listing -> notify listing owner
CREATE OR REPLACE FUNCTION public.notify_on_saved_listing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _owner uuid;
  _title text;
  _actor_name text;
BEGIN
  SELECT user_id, title INTO _owner, _title FROM public.listings WHERE id = NEW.listing_id;
  IF _owner IS NULL OR _owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO _actor_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.user_notifications (user_id, type, title, message, link, actor_id)
  VALUES (
    _owner,
    'favorite',
    'New favorite',
    _actor_name || ' added your listing "' || COALESCE(_title, 'a car') || '" to favorites. They may be interested — start a chat.',
    '/listing/' || NEW.listing_id::text,
    NEW.user_id
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_saved_listing
  AFTER INSERT ON public.saved_listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_saved_listing();

-- Trigger: someone follows you
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor_name text;
BEGIN
  IF NEW.follower_id = NEW.following_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO _actor_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.user_notifications (user_id, type, title, message, link, actor_id)
  VALUES (
    NEW.following_id,
    'follow',
    'New follower',
    _actor_name || ' is now following you.',
    '/user/' || NEW.follower_id::text,
    NEW.follower_id
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: someone reviews your dealer profile
CREATE OR REPLACE FUNCTION public.notify_on_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor_name text;
BEGIN
  IF NEW.reviewer_id = NEW.dealer_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO _actor_name FROM public.profiles WHERE id = NEW.reviewer_id;
  INSERT INTO public.user_notifications (user_id, type, title, message, link, actor_id)
  VALUES (
    NEW.dealer_id,
    'review',
    'New review',
    _actor_name || ' left you a ' || NEW.rating::text || '★ review.',
    '/user/' || NEW.dealer_id::text,
    NEW.reviewer_id
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_review();
