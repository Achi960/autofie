
This is a large batch. Grouping it into clear pieces so we can ship and verify each one.

## 1. Navbar — guest vs signed-in
- Guests on `/` see only: **Sign in**, **Register**, **Sell** (Sell still prompts auth).
- Signed-in users see: Saved (favorites), Messages, My listings, Sell, avatar menu.
- Already mostly true — just hide Saved/Messages/My listings completely for guests and add an explicit **Register** button (today only Sign in shows).

## 2. Profile pictures
- New private storage bucket `avatars` (owner-only read/write via RLS on `storage.objects`).
- Add `avatar_url` to `public.profiles` (path inside `avatars` bucket).
- New page `/account` (under `_authenticated`): upload/replace avatar, edit first/last name & phone.
- Navbar avatar shows the signed URL when present, falls back to initials.
- `ListingCard` and listing detail show the dealer's avatar next to their name.

## 3. Guided "post a car" flow
Replace the one-page form with a 3-step wizard at `/submit-listing`:
1. **Category** — grid of all categories (cars, motorcycles, trucks, parts, etc.) — pick one.
2. **Photos** — require at least **5**, max 10. First is cover.
3. **Details** — title, make, model, year, colour, condition, transmission, fuel, mileage, region, district, price, negotiable, description.
Submit → status `pending` (admin approval unchanged).

## 4. Listing card / detail polish
- **Card**: cover, price, title, verified badge on dealer, region, condition + transmission chips, dealer name + avatar, message button.
- **Detail page**: full specs, dealer block with avatar, verified badge, **"Member since {year}"**, **call** button (tel: link), **message dealer** button, **save to favorites** heart, **follow dealer** button. Increment `phone_clicks` / `chat_clicks` as today.

## 5. Favorites (saved listings) — finish wiring
- `saved_listings` table already exists. Wire heart on `ListingCard` and detail page to insert/delete. `/my-saved` lists them.

## 6. Follows
- New table `public.follows (follower_id, dealer_id, created_at)`, RLS so a user manages only their own rows; anyone authenticated can read counts.
- Follow/unfollow button on dealer block. Show follower count.

## 7. Listing-scoped chat
- `messages` table exists. Constrain chat to `(buyer_id, dealer_id, listing_id)` threads.
- Buyer can only start/continue a thread while the listing status is `active`. Closed/sold/rejected listings disable the composer (existing messages remain visible, read-only).
- `/messages` shows threads grouped by listing with the other party's name + listing title + cover thumb. Click → thread view at `/messages/$listingId/$otherUserId` with realtime updates via Supabase Realtime on `messages`.

## 8. Edit / close / reactivate / delete own listings
- `/my-listings` gets per-row actions:
  - **Edit** → `/edit-listing/$id` (reuse the details form; goes back to `pending` if dealer changes price/title/photos? — keep simple: stays `active`, no re-approval).
  - **Close** → sets status `closed`. Disables new chat messages on that listing.
  - **Mark sold** → already in enum (`sold`).
- New page `/my-listings/closed` lists `closed` (and `sold`/`rejected`) listings with:
  - **Reactivate** → status back to `pending` (admin re-approves).
  - **Delete** → hard delete row + photos from storage.

## 9. Admin (unchanged scope this turn)
- Dealer approval at `/admin/dealers` and listing approval at `/admin/listings` already exist.

## Technical notes
- DB changes done in one migration: `avatar_url` column, `avatars` bucket policies, `follows` table + RLS + grants, `messages` policy tightening so buyers can only insert when listing is `active`, helper view/RPC for thread list.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`.
- New routes:
  - `src/routes/_authenticated/account.tsx`
  - `src/routes/_authenticated/edit-listing.$id.tsx`
  - `src/routes/_authenticated/my-listings.closed.tsx`
  - `src/routes/_authenticated/messages.$listingId.$otherId.tsx` (replaces stub)
- Refactor `submit-listing.tsx` into a 3-step wizard (keep same file).
- New small components: `FollowButton`, `SaveButton`, `MessageDealerButton`, `AvatarUploader`, `DealerInfoCard`.

## Out of scope this turn (flag if you want them)
- Push/email notifications for new messages.
- Reviews/ratings.
- Search & filters on the homepage beyond what exists.

Confirm and I'll build it. Want me to start with everything, or do you want a smaller first slice (say 1–4 now, 5–8 next)?
