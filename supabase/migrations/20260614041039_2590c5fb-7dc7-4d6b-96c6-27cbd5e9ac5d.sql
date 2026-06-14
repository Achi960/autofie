
-- avatar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- follows table: buyer follows a dealer
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, dealer_id),
  CHECK (follower_id <> dealer_id)
);

GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows readable by authenticated"
  ON public.follows FOR SELECT TO authenticated USING (true);

CREATE POLICY "users follow on own behalf"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "users unfollow own rows"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- Tighten messages: only allow inserts when the listing is approved/active,
-- OR when the sender is the listing owner (so dealer can reply on any status).
DROP POLICY IF EXISTS "users send messages" ON public.messages;
CREATE POLICY "users send messages on active listings"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      listing_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id = messages.listing_id
          AND (l.status = 'approved' OR l.user_id = auth.uid())
      )
    )
  );

-- Realtime on messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;

-- Thread list helper: latest message per (listing, other party) for the caller
CREATE OR REPLACE FUNCTION public.list_my_threads()
RETURNS TABLE (
  listing_id uuid,
  other_id uuid,
  last_message text,
  last_at timestamptz,
  unread_count integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  pairs AS (
    SELECT
      m.listing_id,
      CASE WHEN m.sender_id = (SELECT uid FROM me) THEN m.receiver_id ELSE m.sender_id END AS other_id,
      m.content, m.created_at, m.read, m.receiver_id
    FROM public.messages m
    WHERE m.sender_id = (SELECT uid FROM me) OR m.receiver_id = (SELECT uid FROM me)
  ),
  ranked AS (
    SELECT p.*, row_number() OVER (PARTITION BY listing_id, other_id ORDER BY created_at DESC) rn
    FROM pairs p
  )
  SELECT
    r.listing_id, r.other_id, r.content AS last_message, r.created_at AS last_at,
    (SELECT count(*)::int FROM pairs p2
       WHERE p2.listing_id IS NOT DISTINCT FROM r.listing_id
         AND p2.other_id = r.other_id
         AND p2.read = false
         AND p2.receiver_id = (SELECT uid FROM me)) AS unread_count
  FROM ranked r
  WHERE r.rn = 1
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_threads() TO authenticated;
