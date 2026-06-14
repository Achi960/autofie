
-- listing-photos: public read, owner write
CREATE POLICY "anyone reads listing photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'listing-photos');

CREATE POLICY "dealers upload own listing photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "dealers update own listing photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "dealers delete own listing photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- dealer-docs: private; owner + admin only
CREATE POLICY "dealers read own docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dealer-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));

CREATE POLICY "dealers upload own docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dealer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "dealers update own docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'dealer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
