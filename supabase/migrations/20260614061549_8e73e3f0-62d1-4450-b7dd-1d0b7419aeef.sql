
CREATE TABLE public.spam_blocks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blocked_id),
  CONSTRAINT spam_no_self CHECK (user_id <> blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.spam_blocks TO authenticated;
GRANT ALL ON public.spam_blocks TO service_role;

ALTER TABLE public.spam_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own spam list"
  ON public.spam_blocks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
