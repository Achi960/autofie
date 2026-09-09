REVOKE ALL ON FUNCTION public.slugify(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.short_code(text, int) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.build_listing_slug(public.listings) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.build_profile_handle(uuid, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.build_public_code(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.listings_set_slug() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_set_identifiers() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.dealer_sync_handle() FROM anon, authenticated;