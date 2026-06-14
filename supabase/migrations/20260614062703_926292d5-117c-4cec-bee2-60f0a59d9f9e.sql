
-- Path layout: {listingId}/{senderId}/{filename}
-- Authenticated users can upload only into a folder that starts with their own user id at position 2
CREATE POLICY "chat-media insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Read: any authenticated user who is sender OR receiver of a message that points at this object
CREATE POLICY "chat-media read participants"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.attachment_url = storage.objects.name
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  );

-- Sender can delete their own uploaded file (cleanup on failure)
CREATE POLICY "chat-media delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
