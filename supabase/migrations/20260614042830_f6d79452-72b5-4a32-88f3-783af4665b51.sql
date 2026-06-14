ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS registration_year integer;

ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
ALTER TABLE public.listings REPLICA IDENTITY FULL;