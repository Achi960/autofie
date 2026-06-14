
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  reply text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_no_self CHECK (dealer_id <> reviewer_id),
  CONSTRAINT reviews_unique UNIQUE (dealer_id, reviewer_id)
);

CREATE INDEX idx_reviews_dealer ON public.reviews(dealer_id, created_at DESC);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can leave a review"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() <> dealer_id);

CREATE POLICY "Reviewer can update own review, dealer can update reply"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id OR auth.uid() = dealer_id)
  WITH CHECK (auth.uid() = reviewer_id OR auth.uid() = dealer_id);

CREATE POLICY "Reviewer or admin can delete"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
