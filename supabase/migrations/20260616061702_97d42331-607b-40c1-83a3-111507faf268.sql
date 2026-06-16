-- Reviews: split UPDATE policies so dealers cannot use the policy to overwrite reviewer-owned columns
DROP POLICY IF EXISTS "Reviewer can update own review, dealer can update reply" ON public.reviews;

CREATE POLICY "Reviewer can update own review"
ON public.reviews FOR UPDATE
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id AND auth.uid() <> dealer_id);

CREATE POLICY "Dealer can update reply on own review"
ON public.reviews FOR UPDATE
USING (auth.uid() = dealer_id AND auth.uid() <> reviewer_id)
WITH CHECK (
  auth.uid() = dealer_id
  AND auth.uid() <> reviewer_id
);
-- Column-scope for dealer enforced by existing trigger public.enforce_review_update_scope

CREATE POLICY "Admins can update any review"
ON public.reviews FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Listing stats: only expose stats for approved listings
DROP POLICY IF EXISTS "stats publicly readable" ON public.listing_stats;

CREATE POLICY "Stats readable for approved listings"
ON public.listing_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_stats.listing_id
      AND l.status = 'approved'::public.listing_status
  )
  OR EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_stats.listing_id
      AND l.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);