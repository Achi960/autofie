
REVOKE SELECT (contact, contact_name) ON public.listings FROM anon;
GRANT SELECT ON public.listings TO authenticated;

DROP POLICY IF EXISTS "photos visible with listing" ON public.listing_photos;
CREATE POLICY "photos visible with approved or own listing" ON public.listing_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_photos.listing_id
        AND (l.status = 'approved'::listing_status OR l.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );
