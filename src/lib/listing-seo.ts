import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, listingPath } from "@/lib/urls";

export interface ListingMeta {
  id: string; slug: string | null; category: string | null; title: string; description: string | null;
  make: string | null; model: string | null; year: number | null; price: number | null;
  region: string | null; district: string | null; condition: string | null; transmission: string | null;
  fuel: string | null; mileage: number | null; body_type: string | null; colour: string | null;
}

const COLS = "id, slug, category, title, description, make, model, year, price, region, district, condition, transmission, fuel, mileage, body_type, colour";

/** Loads an approved listing by its readable slug (falls back to a raw id). */
export async function loadListingBySlug(slug: string): Promise<ListingMeta | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const q = (supabase.from("listings") as any).select(COLS).eq("status", "approved");
  const { data } = await (isUuid ? q.eq("id", slug) : q.eq("slug", slug)).maybeSingle();
  return (data as ListingMeta) ?? null;
}

/** Builds head() metadata (title, description, canonical, JSON-LD) for a listing page. */
export function listingHead(m: ListingMeta | null | undefined, fallbackPath: string) {
  const url = m ? SITE_URL + listingPath(m) : SITE_URL + fallbackPath;
  const fullTitle = m
    ? `${m.title} — GHS ${Number(m.price ?? 0).toLocaleString()} in ${m.region ?? "Ghana"} | AutoFie`
    : "Vehicle listing — AutoFie";
  const descRaw = m
    ? (m.description?.trim() ||
      `${m.year ?? ""} ${m.make ?? ""} ${m.model ?? ""}${m.condition ? `, ${m.condition}` : ""}${m.transmission ? `, ${m.transmission}` : ""}${m.mileage ? `, ${m.mileage.toLocaleString()} km` : ""}. For sale in ${m.district ?? m.region ?? "Ghana"} on AutoFie.`).trim()
    : "View this vehicle on AutoFie, Ghana's verified marketplace.";
  const description = descRaw.length > 160 ? descRaw.slice(0, 157) + "..." : descRaw;
  const title = fullTitle.slice(0, 60);

  const scripts: { type: string; children: string }[] = [];
  if (m) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: m.title,
        description,
        ...(m.make ? { brand: { "@type": "Brand", name: m.make } } : {}),
        ...(m.model ? { model: m.model } : {}),
        ...(m.colour ? { color: m.colour } : {}),
        offers: {
          "@type": "Offer",
          price: Number(m.price ?? 0),
          priceCurrency: "GHS",
          availability: "https://schema.org/InStock",
          url,
        },
      }),
    });
    const segs = listingPath(m).split("/").filter(Boolean);
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: segs.map((seg, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: i === segs.length - 1 ? m.title : seg.replace(/-/g, " "),
          item: `${SITE_URL}/${segs.slice(0, i + 1).join("/")}`,
        })),
      }),
    });
  }

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts,
  };
}
