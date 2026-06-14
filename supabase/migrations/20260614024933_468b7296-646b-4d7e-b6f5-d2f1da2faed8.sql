
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('buyer', 'dealer_pending', 'dealer_verified', 'admin');
CREATE TYPE public.dealer_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.listing_status AS ENUM ('pending', 'approved', 'rejected', 'closed');
CREATE TYPE public.listing_category AS ENUM ('car', 'motorcycle', 'bus', 'truck', 'heavy_equipment', 'parts', 'accessories', 'services');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name)
  VALUES (NEW.id, NEW.phone, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END; $$;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- now create the auth trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin can manage roles
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ DEALER_PROFILES ============
CREATE TABLE public.dealer_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  phone TEXT NOT NULL,
  ghana_card_number TEXT NOT NULL,
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  status public.dealer_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.dealer_profiles TO authenticated;
GRANT SELECT ON public.dealer_profiles TO anon;
GRANT ALL ON public.dealer_profiles TO service_role;
ALTER TABLE public.dealer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealers see own application" ON public.dealer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "public sees approved business basics" ON public.dealer_profiles FOR SELECT TO anon
  USING (status = 'approved');
CREATE POLICY "dealers insert own application" ON public.dealer_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dealers update own pending application" ON public.dealer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE TRIGGER trg_dealer_updated BEFORE UPDATE ON public.dealer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LISTINGS ============
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.listing_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  make TEXT,
  model TEXT,
  year INT,
  condition TEXT,
  transmission TEXT,
  fuel TEXT,
  mileage INT,
  body_type TEXT,
  colour TEXT,
  engine TEXT,
  vin TEXT,
  registration_status TEXT,
  registration_year INT,
  region TEXT,
  district TEXT,
  price NUMERIC(12,2) NOT NULL,
  negotiable BOOLEAN NOT NULL DEFAULT false,
  contact TEXT,
  status public.listing_status NOT NULL DEFAULT 'pending',
  cover_photo_url TEXT,
  rejection_reason TEXT,
  closed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_user ON public.listings(user_id);
CREATE INDEX idx_listings_created ON public.listings(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved listings public" ON public.listings FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "verified dealers insert listings" ON public.listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'dealer_verified'));
CREATE POLICY "dealers update own listings" ON public.listings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "dealers delete own listings" ON public.listings FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LISTING_PHOTOS ============
CREATE TABLE public.listing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_listing ON public.listing_photos(listing_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_photos TO authenticated;
GRANT SELECT ON public.listing_photos TO anon;
GRANT ALL ON public.listing_photos TO service_role;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos visible with listing" ON public.listing_photos FOR SELECT USING (true);
CREATE POLICY "dealers manage own photos" ON public.listing_photos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.user_id = auth.uid() OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.user_id = auth.uid() OR public.is_admin(auth.uid()))));

-- ============ SAVED_LISTINGS ============
CREATE TABLE public.saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_listings TO authenticated;
GRANT ALL ON public.saved_listings TO service_role;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own saves" ON public.saved_listings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ LISTING_STATS ============
CREATE TABLE public.listing_stats (
  listing_id UUID PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  views INT NOT NULL DEFAULT 0,
  phone_clicks INT NOT NULL DEFAULT 0,
  chat_clicks INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.listing_stats TO authenticated;
GRANT SELECT ON public.listing_stats TO anon;
GRANT ALL ON public.listing_stats TO service_role;
ALTER TABLE public.listing_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats publicly readable" ON public.listing_stats FOR SELECT USING (true);

-- RPC to increment stats safely from anyone
CREATE OR REPLACE FUNCTION public.increment_listing_stat(_listing_id UUID, _field TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _field NOT IN ('views','phone_clicks','chat_clicks') THEN
    RAISE EXCEPTION 'invalid field';
  END IF;
  INSERT INTO public.listing_stats (listing_id) VALUES (_listing_id) ON CONFLICT (listing_id) DO NOTHING;
  EXECUTE format('UPDATE public.listing_stats SET %I = %I + 1, updated_at = now() WHERE listing_id = $1', _field, _field) USING _listing_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_listing_stat(UUID, TEXT) TO anon, authenticated;

-- ============ MESSAGES (schema only, UI is phase 2) ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_pair ON public.messages(sender_id, receiver_id);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own conversations" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "users send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "receiver marks read" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
