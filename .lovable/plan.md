# Readable web addresses and short user IDs

Today a car page looks like `autofie.com/listing/cd14c0c2-0600-40ca-b57b-84780564b67c` and a user is shown as `bce29ce1-02fe-483b-a028-73d56e6359ac`. Both become short, readable and unique.

## New address shapes

| Page | Now | After |
| --- | --- | --- |
| Car for sale | `/listing/cd14c0c2-...` | `/cars/toyota/toyota-corolla-2015-red-8kd2` |
| Motorbike | `/listing/...` | `/motorcycles/honda/honda-cb125-2019-black-p4qa` |
| Part / accessory / service | `/listing/...` | `/parts/bosch-brake-pads-front-3nvx` |
| Seller page | `/user/bce29ce1-...` | `/dealer/kwame-motors` |
| Review link | `/review/<long id>` | `/dealer/kwame-motors/reviews` |

The four characters at the end of a car address keep every address unique when two people list the same car, and they never change.

## Short user ID

Every account gets a short public code such as `AF-8KD2QP` (8 characters, unique, never reused). This is what shows anywhere an ID is displayed today, and it is what admins search by. The long internal ID stays behind the scenes so nothing breaks.

Sellers also get a name-based handle (`kwame-motors`) used in their page address, taken from their business or full name, with a number added if that name is taken.

## Old links keep working

Every existing long address permanently forwards to its new short one, so links already shared, and anything Google has indexed, keep working and pass their ranking on.

## Search results

- Sitemap lists the new readable addresses only, grouped by category, plus category and make pages.
- Each page keeps its own title, description and canonical address, now pointing at the new address.
- Breadcrumb data is added (Home > Cars > Toyota > this car) so Google can show the trail under the result.

## Technical notes

- Migration: add `slug` (unique) to `listings`, `handle` (unique) + `public_code` (unique) to `profiles`; backfill all existing rows; database trigger keeps slug/handle in sync on insert and on make/model/year/colour changes (slug is only regenerated while a listing is still a draft, so live addresses stay stable).
- New routes: `src/routes/$category.$make.$slug.tsx`, `src/routes/$category.$slug.tsx` (non-vehicle), `src/routes/dealer.$handle.tsx`, `src/routes/dealer.$handle.reviews.tsx`.
- Old routes `listing.$id.tsx`, `user.$id.tsx`, `review.$id.tsx` become thin 301 redirect loaders.
- All `Link to="/listing/$id"` / `"/user/$id"` call sites updated to the new params (cards, chat, admin, reviews, navbar, my-listings).
- `sitemap.xml` rebuilt from slugs and handles; JSON-LD gains `BreadcrumbList`.
