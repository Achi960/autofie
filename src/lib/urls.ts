import type { CategorySlug } from "@/lib/ghana";

export const SITE_URL = "https://autofie.com";

/** Readable URL segment for each listing category. */
export const CATEGORY_URL: Record<CategorySlug, string> = {
  car: "cars",
  motorcycle: "motorcycles",
  bus: "buses",
  truck: "trucks",
  heavy_equipment: "heavy-machinery",
  parts: "parts",
  accessories: "accessories",
  services: "services",
};

export const URL_CATEGORY: Record<string, CategorySlug> = Object.entries(CATEGORY_URL)
  .reduce((acc, [db, url]) => { acc[url] = db as CategorySlug; return acc; }, {} as Record<string, CategorySlug>);

/** Categories whose URLs carry a make/brand segment. */
const WITH_MAKE: readonly CategorySlug[] = ["car", "motorcycle", "bus", "truck", "heavy_equipment"];

export function slugifyText(input: string | null | undefined): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export interface ListingRef {
  id: string;
  slug?: string | null;
  category?: string | null;
  make?: string | null;
}

export function categorySegment(category: string | null | undefined): string {
  return CATEGORY_URL[(category ?? "car") as CategorySlug] ?? "listings";
}

export function makeSegment(make: string | null | undefined): string {
  return slugifyText(make) || "other";
}

/** Human-readable path for a listing, e.g. /cars/toyota/toyota-vitz-2010-grey-1gn0 */
export function listingPath(l: ListingRef): string {
  const cat = categorySegment(l.category);
  const slug = l.slug || l.id;
  return WITH_MAKE.includes((l.category ?? "") as CategorySlug)
    ? `/${cat}/${makeSegment(l.make)}/${slug}`
    : `/${cat}/${slug}`;
}

export function listingUrl(l: ListingRef): string {
  return SITE_URL + listingPath(l);
}

export function dealerPath(handle: string | null | undefined, fallbackId?: string): string {
  return handle ? `/dealer/${handle}` : `/user/${fallbackId ?? ""}`;
}

export function dealerUrl(handle: string | null | undefined, fallbackId?: string): string {
  return SITE_URL + dealerPath(handle, fallbackId);
}
