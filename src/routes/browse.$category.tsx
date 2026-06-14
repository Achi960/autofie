import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, ALL_BRANDS, CONDITIONS, TRANSMISSIONS, FUELS, BODY_TYPES, ALL_REGIONS } from "@/lib/ghana";
import { shuffleByMinute } from "@/lib/shuffle";

const searchSchema = z.object({
  q: z.string().optional(),
  make: z.string().optional(),
  region: z.string().optional(),
  condition: z.string().optional(),
  transmission: z.string().optional(),
  fuel: z.string().optional(),
  body: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
}).partial();

export const Route = createFileRoute("/browse/$category")({
  validateSearch: searchSchema,
  head: ({ params }) => {
    const cat = CATEGORIES.find((c) => c.slug === params.category)?.label ?? "Listings";
    return {
      meta: [
        { title: `${cat} for sale in Ghana — Autofie` },
        { name: "description", content: `Browse ${cat.toLowerCase()} from verified dealers across Ghana on Autofie.` },
        { property: "og:title", content: `${cat} for sale in Ghana — Autofie` },
        { property: "og:description", content: `Browse ${cat.toLowerCase()} from verified dealers across Ghana on Autofie.` },
      ],
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
        .select(`id, title, price, region, condition, transmission, mileage, cover_photo_url, user_id,
                 listing_stats(views),
                 profiles!listings_user_id_fkey(full_name),
                 dealer_profiles!dealer_profiles_user_id_fkey(status)`, { count: "exact" })
        .eq("status", "approved")
        .eq("category", category as any);

      if (search.q) q = q.ilike("title", `%${search.q}%`);
      if (search.make) q = q.eq("make", search.make);
      if (search.region) q = q.eq("region", search.region);
      if (search.condition) q = q.eq("condition", search.condition);
      if (search.transmission) q = q.eq("transmission", search.transmission);
      if (search.fuel) q = q.eq("fuel", search.fuel);
      if (search.body) q = q.eq("body_type", search.body);
      if (search.min_price) q = q.gte("price", search.min_price);
      if (search.max_price) q = q.lte("price", search.max_price);

      q = q.order("created_at", { ascending: false }).range(from, to);

      const { data, count } = await q;
      if (!alive) return;
      setTotal(count ?? 0);
      setListings((data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        price: Number(row.price),
        region: row.region,
        condition: row.condition,
        transmission: row.transmission,
        mileage: row.mileage,
        cover_photo_url: row.cover_photo_url,
        views: row.listing_stats?.views ?? 0,
        dealer_name: row.profiles?.full_name ?? null,
        dealer_verified: row.dealer_profiles?.status === "approved",
      })));
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [category, search.q, search.make, search.region, search.condition, search.transmission, search.fuel, search.body, search.min_price, search.max_price, search.page]);

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
          <FilterSelect label="Region" value={search.region} options={ALL_REGIONS} onChange={(v) => setFilter("region", v)} />
          <FilterSelect label="Condition" value={search.condition} options={CONDITIONS as unknown as string[]} onChange={(v) => setFilter("condition", v)} />
          <FilterSelect label="Transmission" value={search.transmission} options={TRANSMISSIONS as unknown as string[]} onChange={(v) => setFilter("transmission", v)} />
          <FilterSelect label="Fuel" value={search.fuel} options={FUELS as unknown as string[]} onChange={(v) => setFilter("fuel", v)} />
          <FilterSelect label="Body type" value={search.body} options={BODY_TYPES as unknown as string[]} onChange={(v) => setFilter("body", v)} />
          <div className="col-span-2 flex items-center gap-2 sm:col-span-2 lg:col-span-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Min price"
              defaultValue={search.min_price ?? ""}
              onBlur={(e) => setFilter("min_price", e.target.value || undefined)}
            />
            <Input
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

function FilterSelect({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (v: string | undefined) => void }) {
  return (
    <Select value={value ?? "__all"} onValueChange={(v) => onChange(v === "__all" ? undefined : v)}>
      <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">Any {label.toLowerCase()}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
