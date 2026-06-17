import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, ALL_BRANDS, CONDITIONS, ALL_REGIONS, REGIONS } from "@/lib/ghana";
import { shuffleByMinute } from "@/lib/shuffle";

const searchSchema = z.object({
  q: z.string().optional(),
  make: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  condition: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
}).partial();

export const Route = createFileRoute("/browse/$category")({
  validateSearch: searchSchema,
  head: ({ params }) => {
    const cat = CATEGORIES.find((c) => c.slug === params.category)?.label ?? "Listings";
    const url = `https://autofie.com/browse/${params.category}`;
    return {
      meta: [
        { title: `${cat} for sale in Ghana — AutoFie` },
        { name: "description", content: `Browse ${cat.toLowerCase()} from verified dealers across Ghana on AutoFie.` },
        { property: "og:title", content: `${cat} for sale in Ghana — AutoFie` },
        { property: "og:description", content: `Browse ${cat.toLowerCase()} from verified dealers across Ghana on AutoFie.` },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${cat} for sale in Ghana`,
          url,
        }),
      }],
    };
  },
  component: BrowsePage,
});

const PAGE_SIZE = 18;

function BrowsePage() {
  const { category } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const catLabel = useMemo(() => CATEGORIES.find((c) => c.slug === category)?.label ?? "Listings", [category]);

  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const page = search.page ?? 1;
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("listings")
        .select(`id, title, price, region, condition, transmission, mileage, cover_photo_url, user_id, category, make, year,
                 listing_stats(views)`, { count: "exact" })
        .eq("status", "approved")
        .eq("category", category as any);

      if (search.q) q = q.ilike("title", `%${search.q}%`);
      if (search.make) q = q.eq("make", search.make);
      if (search.region) q = q.eq("region", search.region);
      if (search.district) q = q.eq("district", search.district);
      if (search.condition) q = q.eq("condition", search.condition);
      if (search.min_price) q = q.gte("price", search.min_price);
      if (search.max_price) q = q.lte("price", search.max_price);

      q = q.order("created_at", { ascending: false }).range(from, to);

      const { data, count } = await q;
      if (!alive) return;
      setTotal(count ?? 0);

      const rows = data ?? [];
      const userIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
      const [{ data: profs }, { data: deals }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("id, full_name").in("id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        userIds.length
          ? supabase.from("dealer_profiles").select("user_id, status").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      const dealMap = new Map((deals ?? []).map((d: any) => [d.user_id, d]));

      const mapped = rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        price: Number(row.price),
        region: row.region,
        condition: row.condition,
        transmission: row.transmission,
        mileage: row.mileage,
        cover_photo_url: row.cover_photo_url,
        views: row.listing_stats?.views ?? 0,
        dealer_name: profMap.get(row.user_id)?.full_name ?? null,
        dealer_verified: dealMap.get(row.user_id)?.status === "approved",
        category: row.category,
        make: row.make,
        year: row.year,
      }));
      setListings(shuffleByMinute(mapped, page));
      setLoading(false);
    };
    load();
    const id = setInterval(() => {
      setListings((prev) => shuffleByMinute(prev, search.page ?? 1));
    }, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [category, search.q, search.make, search.region, search.district, search.condition, search.min_price, search.max_price, search.page]);

  const setFilter = (key: string, value: string | undefined) => {
    navigate({ search: (s: Record<string, unknown>) => ({ ...s, [key]: value || undefined, page: 1 }) });
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = search.page ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{catLabel} in Ghana</h1>
          <p className="text-sm text-muted-foreground">{total} {total === 1 ? "result" : "results"}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border bg-card p-3 sm:grid-cols-4 lg:grid-cols-6">
          <FilterSelect label="Make" value={search.make} options={ALL_BRANDS} onChange={(v) => setFilter("make", v)} />
          <FilterSelect
            label="Region"
            value={search.region}
            options={ALL_REGIONS}
            onChange={(v) => {
              // also clear district when region changes
              navigate({ search: (s: Record<string, unknown>) => ({ ...s, region: v || undefined, district: undefined, page: 1 }) });
            }}
          />
          <FilterSelect
            label="District"
            value={search.district}
            options={search.region ? REGIONS[search.region] ?? [] : []}
            onChange={(v) => setFilter("district", v)}
            disabled={!search.region}
          />
          <FilterSelect label="Condition" value={search.condition} options={CONDITIONS as unknown as string[]} onChange={(v) => setFilter("condition", v)} />
          <div className="col-span-2 flex items-center gap-2 sm:col-span-2 lg:col-span-2">
            <Input
              aria-label="Minimum price"
              type="number"
              inputMode="numeric"
              placeholder="Min price"
              defaultValue={search.min_price ?? ""}
              onBlur={(e) => setFilter("min_price", e.target.value || undefined)}
            />
            <Input
              aria-label="Maximum price"
              type="number"
              inputMode="numeric"
              placeholder="Max price"
              defaultValue={search.max_price ?? ""}
              onBlur={(e) => setFilter("max_price", e.target.value || undefined)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : listings.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
            No matching listings. Try clearing filters.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>

            {pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1}
                  onClick={() => navigate({ search: (s: Record<string, unknown>) => ({ ...s, page: currentPage - 1 }) })}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {pages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= pages}
                  onClick={() => navigate({ search: (s: Record<string, unknown>) => ({ ...s, page: currentPage + 1 }) })}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange, disabled }: { label: string; value?: string; options: string[]; onChange: (v: string | undefined) => void; disabled?: boolean }) {
  return (
    <Select value={value ?? "__all"} onValueChange={(v) => onChange(v === "__all" ? undefined : v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">Any {label.toLowerCase()}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
