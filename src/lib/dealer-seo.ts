import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/urls";

export interface DealerMeta {
  id: string;
  handle: string | null;
  public_code: string | null;
  name: string;
  region: string | null;
  district: string | null;
  verified: boolean;
}

/** Resolves a seller by readable handle (or public code / raw id fallback). */
export async function loadDealerByHandle(handle: string): Promise<DealerMeta | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle);
  const base = (supabase.from("profiles") as any).select("id, full_name, handle, public_code");
  const q = isUuid
    ? base.eq("id", handle)
    : /^AF-/i.test(handle)
      ? base.eq("public_code", handle.toUpperCase())
      : base.eq("handle", handle.toLowerCase());
  const { data: p } = await q.maybeSingle();
  if (!p) return null;
  const { data: d } = await (supabase.from("dealer_profiles") as any)
    .select("business_name, region, district, status")
    .eq("user_id", p.id)
    .maybeSingle();
  return {
    id: p.id as string,
    handle: (p.handle as string) ?? null,
    public_code: (p.public_code as string) ?? null,
    name: (d?.business_name as string) || (p.full_name as string) || "Dealer",
    region: (d?.region as string) ?? null,
    district: (d?.district as string) ?? null,
    verified: d?.status === "approved",
  };
}

export function dealerHead(d: DealerMeta | null | undefined, handleParam: string, suffix = "") {
  const url = `${SITE_URL}/dealer/${d?.handle || handleParam}${suffix}`;
  const name = d?.name || "Dealer";
  const loc = [d?.district, d?.region].filter(Boolean).join(", ");
  const verifiedTxt = d?.verified ? "Verified dealer" : "Dealer";
  const title = suffix
    ? `Reviews for ${name} on AutoFie`
    : `${name} — ${verifiedTxt}${loc ? ` in ${loc}` : ""} on AutoFie`;
  const description = suffix
    ? `Read and write reviews for ${name}${loc ? ` in ${loc}` : ""} on AutoFie, Ghana's verified vehicle marketplace.`
    : `Browse vehicle listings from ${name}${loc ? `, based in ${loc}` : ""}${d?.verified ? ", a Ghana Card verified dealer" : ""} on AutoFie.`;
  return {
    meta: [
      { title: title.slice(0, 60) },
      { name: "description", content: description.slice(0, 160) },
      { property: "og:title", content: title.slice(0, 60) },
      { property: "og:description", content: description.slice(0, 160) },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: {
          "@type": d?.verified ? "Organization" : "Person",
          name,
          url,
          ...(loc ? { address: { "@type": "PostalAddress", addressLocality: d?.district || undefined, addressRegion: d?.region || undefined, addressCountry: "GH" } } : {}),
        },
      }),
    }],
  };
}
