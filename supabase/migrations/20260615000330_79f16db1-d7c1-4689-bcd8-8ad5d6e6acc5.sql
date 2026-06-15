
-- 1) profiles: hide sensitive contact columns from anonymous visitors
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, first_name, last_name, avatar_url, last_seen_at, created_at, updated_at)
  ON public.profiles TO anon;

-- 2) dealer_profiles: hide identity documents and phone from anonymous visitors
REVOKE SELECT ON public.dealer_profiles FROM anon;
GRANT SELECT (user_id, business_name, region, district, status, submitted_at, reviewed_at, updated_at)
  ON public.dealer_profiles TO anon;

-- 3) listings: prevent dealers from self-approving via a BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.enforce_listing_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_admin(auth.uid()) THEN
    -- non-admins may only close their own listing
    IF NEW.status <> 'closed'::public.listing_status THEN
      RAISE EXCEPTION 'Only administrators can change listing status to %', NEW.status
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_listing_status_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_listing_status_change ON public.listings;
CREATE TRIGGER enforce_listing_status_change
  BEFORE UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_status_change();

-- 4) reviews: scope updates so dealers cannot rewrite the reviewer's comment/rating
CREATE OR REPLACE FUNCTION public.enforce_review_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF public.is_admin(uid) THEN
    RETURN NEW;
  END IF;
  -- Dealer (not the reviewer) may only touch reply/replied_at
  IF uid = OLD.dealer_id AND uid <> OLD.reviewer_id THEN
    IF NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.comment IS DISTINCT FROM OLD.comment
       OR NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id
       OR NEW.dealer_id IS DISTINCT FROM OLD.dealer_id THEN
      RAISE EXCEPTION 'Dealers can only update the reply on a review'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  -- Reviewer (not the dealer) cannot write a reply on their own review
  IF uid = OLD.reviewer_id AND uid <> OLD.dealer_id THEN
    IF NEW.reply IS DISTINCT FROM OLD.reply
       OR NEW.replied_at IS DISTINCT FROM OLD.replied_at
       OR NEW.dealer_id IS DISTINCT FROM OLD.dealer_id
       OR NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id THEN
      RAISE EXCEPTION 'Reviewers cannot write the dealer reply'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_review_update_scope() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_review_update_scope ON public.reviews;
CREATE TRIGGER enforce_review_update_scope
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_update_scope();

-- 5) Lock down internal helper/trigger functions from direct public callability
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_saved_listing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_review() FROM PUBLIC, anon, authenticated;
