-- 1) Hide contact / contact_name on listings from anonymous users.
--    Replace table-level SELECT for anon with column-level grants that omit contact info.
REVOKE SELECT ON public.listings FROM anon;
GRANT SELECT (
  id, user_id, category, title, description,
  make, model, year, condition, transmission, fuel, mileage,
  body_type, colour, engine, vin, registration_status, registration_year,
  region, district, price, negotiable,
  status, cover_photo_url, rejection_reason, closed_reason,
  created_at, updated_at
) ON public.listings TO anon;

-- 2) Prevent blocked senders from inserting messages to users who blocked them.
DROP POLICY IF EXISTS "users send messages on active listings" ON public.messages;
CREATE POLICY "users send messages on active listings"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      listing_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id = messages.listing_id
          AND (l.status = 'approved'::listing_status OR l.user_id = auth.uid())
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.spam_blocks sb
      WHERE sb.user_id = messages.receiver_id
        AND sb.blocked_id = auth.uid()
    )
  );