import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShieldCheck, BadgeCheck, Users, MessageCircle, Star, MapPin, Lock, Zap, Quote } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { CATEGORIES } from "@/lib/ghana";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { shuffleByMinute } from "@/lib/shuffle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoFie — Buy and sell cars in Ghana" },
      { name: "description", content: "Browse thousands of cars, trucks, motorcycles and vehicle parts from verified dealers across Ghana. Post your ad free." },
      { property: "og:title", content: "AutoFie — Buy and sell cars in Ghana" },
      { property: "og:description", content: "Browse thousands of cars, trucks, motorcycles and vehicle parts from verified dealers across Ghana." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { user, isVerifiedDealer, isPendingDealer } = useAuth();
  const [query, setQuery] = useState("");
  const [allListings, setAllListings] = useState<ListingCardData[]>([]);
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("listings")
        .select(`id, title, price, region, condition, transmission, mileage, cover_photo_url, user_id,
                 listing_stats(views)`)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(48);
      if (!alive || !data) { setLoading(false); return; }

      // Fetch related profile & dealer info in parallel (no FK between listings <-> profiles)
      const userIds = Array.from(new Set(data.map((r: any) => r.user_id).filter(Boolean)));
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

      const mapped: ListingCardData[] = data.map((row: any) => ({
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
      }));
      setAllListings(mapped);
      setListings(shuffleByMinute(mapped).slice(0, 12));
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, []);

  // Re-shuffle every minute so the front page mixes naturally.
  useEffect(() => {
    if (!allListings.length) return;
    const id = setInterval(() => {
      setListings(shuffleByMinute(allListings).slice(0, 12));
    }, 60_000);
    return () => clearInterval(id);
  }, [allListings]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/browse/$category", params: { category: "car" }, search: query ? { q: query } : undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary to-secondary/90 py-14 text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Identity-verified dealers only
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Ghana's trusted marketplace for vehicles
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:text-base">
            Cars, motorbikes, trucks, parts and services — from dealers verified with Ghana Card. No scams, no fake listings.
          </p>
          <form onSubmit={onSearch} className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-xl ring-1 ring-black/5">
            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Toyota, Honda, Hyundai…"
              className="border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="sm" className="rounded-full px-5">Search</Button>
          </form>

          {/* Trust strip */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center text-[11px] sm:text-xs">
            {[
              { icon: BadgeCheck, label: "Verified dealers" },
              { icon: Users, label: "Trusted by buyers" },
              { icon: MessageCircle, label: "Chat in-app" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1 rounded-lg bg-white/10 px-2 py-3 backdrop-blur">
                <b.icon className="h-4 w-4" />
                <span className="font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Browse by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find exactly what you're looking for</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/browse/$category"
              params={{ category: c.slug }}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <div className="overflow-hidden rounded-lg">
                <img src={c.image} alt={c.label} width={72} height={72} loading="lazy" className="h-16 w-16 object-cover transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-xs font-medium text-foreground">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Fresh listings</h2>
            <p className="mt-1 text-sm text-muted-foreground">Updated every minute — see something new each visit</p>
          </div>
          <Link to="/browse/$category" params={{ category: "car" }} className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            No listings yet. Be the first to post one!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">How AutoFie works</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Simple, safe, and built for Ghana</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { n: 1, t: "Browse freely", d: "Search thousands of vehicles across all 16 regions. No account needed." },
              { n: 2, t: "Chat with dealers", d: "Reach verified dealers directly with one tap. See when they're online." },
              { n: 3, t: "Buy with confidence", d: "Every dealer is verified with Ghana Card before posting." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border bg-card p-6 text-center shadow-sm transition hover:shadow-md">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">{s.n}</div>
                <h3 className="font-semibold text-foreground">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / social proof */}
      <section className="bg-secondary/5 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4">
          {[
            { n: "500+", l: "Verified dealers" },
            { n: "16", l: "Regions covered" },
            { n: "10k+", l: "Active buyers" },
            { n: "4.8★", l: "Average rating" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl font-extrabold text-primary sm:text-4xl">{s.n}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why AutoFie */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Why Ghanaians choose AutoFie</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Built locally, with the safeguards buyers and sellers actually need.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Ghana Card verified", d: "Every dealer is identity-checked before posting. No anonymous sellers." },
            { icon: Lock, t: "Safe in-app chat", d: "Talk and share photos privately. Your phone number stays hidden until you choose." },
            { icon: MapPin, t: "All 16 regions", d: "From Accra to Tamale — find vehicles close to you, or anywhere in Ghana." },
            { icon: Zap, t: "Free to post", d: "List your vehicle in under 2 minutes. No hidden fees, no commissions." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border bg-card p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{f.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Trusted by Ghanaians</h2>
            <p className="mt-2 text-sm text-muted-foreground">Real stories from buyers and dealers on AutoFie.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { q: "Sold my Corolla in 4 days. The buyer came straight from chat — no middlemen, no stress.", n: "Kwabena A.", r: "Dealer, Kumasi" },
              { q: "I trusted it because every dealer shows their Ghana Card verification badge. Bought my first car here.", n: "Akosua M.", r: "Buyer, Accra" },
              { q: "The in-app chat is fast and dealers actually reply. Saved me from so many fake adverts.", n: "Yaw O.", r: "Buyer, Takoradi" },
            ].map((t) => (
              <figure key={t.n} className="rounded-xl border bg-card p-6 shadow-sm">
                <Quote className="h-5 w-5 text-primary/60" />
                <blockquote className="mt-3 text-sm leading-relaxed text-foreground">"{t.q}"</blockquote>
                <div className="mt-4 flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <figcaption className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{t.n}</span> · {t.r}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Dealer CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-secondary/90 p-8 text-center text-white sm:p-14">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5" /> For dealers
            </span>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Sell faster on AutoFie</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/90">Join hundreds of verified dealers across Ghana. Post unlimited ads. Reach serious buyers.</p>
            <Button
              size="lg"
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (!user) return;
                if (isVerifiedDealer) navigate({ to: "/submit-listing" });
                else navigate({ to: "/complete-dealer-profile" });
              }}
            >
              {isVerifiedDealer ? "Post a listing" : isPendingDealer ? "Application under review" : "Become a dealer"}
            </Button>
            <p className="mt-3 text-xs text-white/75">Free to join · Verified with Ghana Card · No commission on sales</p>
          </div>
        </div>
      </section>

      <footer className="border-t bg-surface py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AutoFie. Built for Ghana.
        </div>
      </footer>
    </div>
  );
}

function CategoryIcon({ slug }: { slug: string }) {
  const common = "h-7 w-7 text-primary";
  switch (slug) {
    case "car":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5v4a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0H3v-4Z" /></svg>;
    case "motorcycle":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="m14 7 2 3 3 4M10 7h4l-3 7H8" /></svg>;
    case "bus":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="13" rx="2" /><path d="M4 11h16M8 17v2M16 17v2M8 7h8" /></svg>;
    case "truck":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h11v11H3zM14 9h4l3 4v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
    case "heavy_equipment":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 19h11l3-3V9l-5-5-3 5v6H3z" /><circle cx="7" cy="20" r="1.5" /><circle cx="14" cy="20" r="1.5" /></svg>;
    case "parts":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /></svg>;
    case "accessories":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16l-1 12H5L4 7zM9 7V5a3 3 0 1 1 6 0v2" /></svg>;
    case "services":
      return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m14 6 4 4-10 10H4v-4L14 6zM13 7l4 4" /></svg>;
    default:
      return null;
  }
}
