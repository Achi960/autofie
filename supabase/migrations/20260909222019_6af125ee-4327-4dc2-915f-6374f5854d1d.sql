-- 1. Ban details: only admins (service side) need the reason/date; hide from ordinary signed-in users.
REVOKE SELECT (banned_reason, banned_at) ON public.profiles FROM authenticated;

-- 2. Listing photos: reading a photo file now requires the listing to be approved,
--    or the requester to own it / be an admin.
DROP POLICY IF EXISTS "anyone reads listing photos" ON storage.objects;

CREATE POLICY "listing photos readable for approved or own listings"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'listing-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.listing_photos lp
      JOIN public.listings l ON l.id = lp.listing_id
      WHERE lp.url = storage.objects.name AND l.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.cover_photo_url = storage.objects.name AND l.status = 'approved'
    )
  )
);