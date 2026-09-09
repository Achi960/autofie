-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(_input, '')), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.short_code(_seed text, _len int DEFAULT 4)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT substr(translate(md5(_seed), 'abcdef', 'ghjkmn'), 1, _len)
$$;

-- ---------- listings.slug ----------
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.build_listing_slug(_row public.listings)
RETURNS text LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE base text; code text;
BEGIN
  IF _row.category IN ('car','motorcycle','bus','truck','heavy_equipment') THEN
    base := public.slugify(concat_ws(' ', _row.make, _row.model, _row.year::text, _row.colour));
  ELSE
    base := public.slugify(_row.title);
  END IF;
  IF base IS NULL OR base = '' THEN base := public.slugify(_row.title); END IF;
  IF base IS NULL OR base = '' THEN base := 'listing'; END IF;
  base := substr(base, 1, 80);
  code := public.short_code(_row.id::text, 4);
  RETURN base || '-' || code;
END;
$$;

CREATE OR REPLACE FUNCTION public.listings_set_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.slug IS NULL OR NEW.slug = ''
     OR (NEW.status = 'pending' AND (
          NEW.make IS DISTINCT FROM OLD.make OR NEW.model IS DISTINCT FROM OLD.model
          OR NEW.year IS DISTINCT FROM OLD.year OR NEW.colour IS DISTINCT FROM OLD.colour
          OR NEW.title IS DISTINCT FROM OLD.title OR NEW.category IS DISTINCT FROM OLD.category)) THEN
    NEW.slug := public.build_listing_slug(NEW);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listings_set_slug ON public.listings;
CREATE TRIGGER trg_listings_set_slug
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.listings_set_slug();

UPDATE public.listings l SET slug = public.build_listing_slug(l) WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS listings_slug_key ON public.listings (slug);

-- ---------- profiles.handle / public_code ----------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_code text;

CREATE OR REPLACE FUNCTION public.build_profile_handle(_user_id uuid, _name text)
RETURNS text LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE base text; candidate text; n int := 1;
BEGIN
  base := substr(public.slugify(_name), 1, 40);
  IF base IS NULL OR base = '' THEN base := 'seller'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles p WHERE p.handle = candidate AND p.id <> _user_id) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.build_public_code(_user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE candidate text; n int := 0;
BEGIN
  LOOP
    candidate := 'AF-' || upper(public.short_code(_user_id::text || n::text, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.public_code = candidate AND p.id <> _user_id);
    n := n + 1;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_set_identifiers()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.public_code IS NULL OR NEW.public_code = '' THEN
    NEW.public_code := public.build_public_code(NEW.id);
  END IF;
  IF NEW.handle IS NULL OR NEW.handle = '' THEN
    NEW.handle := public.build_profile_handle(NEW.id, coalesce(
      (SELECT d.business_name FROM public.dealer_profiles d WHERE d.user_id = NEW.id),
      NEW.full_name,
      concat_ws(' ', NEW.first_name, NEW.last_name)));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_set_identifiers ON public.profiles;
CREATE TRIGGER trg_profiles_set_identifiers
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_set_identifiers();

-- keep handle in step with a newly created dealer business name
CREATE OR REPLACE FUNCTION public.dealer_sync_handle()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.profiles p
     SET handle = public.build_profile_handle(p.id, NEW.business_name)
   WHERE p.id = NEW.user_id
     AND (p.handle IS NULL OR p.handle = '' OR p.handle LIKE 'seller%');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dealer_sync_handle ON public.dealer_profiles;
CREATE TRIGGER trg_dealer_sync_handle
AFTER INSERT OR UPDATE OF business_name ON public.dealer_profiles
FOR EACH ROW EXECUTE FUNCTION public.dealer_sync_handle();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.id, coalesce(d.business_name, p.full_name, concat_ws(' ', p.first_name, p.last_name)) AS nm
             FROM public.profiles p
             LEFT JOIN public.dealer_profiles d ON d.user_id = p.id
            WHERE p.handle IS NULL OR p.handle = '' OR p.public_code IS NULL OR p.public_code = ''
  LOOP
    UPDATE public.profiles
       SET handle = coalesce(nullif(handle, ''), public.build_profile_handle(r.id, r.nm)),
           public_code = coalesce(nullif(public_code, ''), public.build_public_code(r.id))
     WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_key ON public.profiles (handle);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_code_key ON public.profiles (public_code);