import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, MessageCircle, Heart, MapPin, Gauge, Calendar, Fuel, Settings, Palette, BadgeCheck, Share2, Eye } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl, signedUrls } from "@/lib/storage";
import { formatGHS, formatMileage, initialsOf } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverIdx, setCoverIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showWa, setShowWa] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"choose" | "signin" | "register">("choose");
  const openAuth = (step: "choose" | "signin" | "register" = "choose") => { setAuthStep(step); setAuthOpen(true); };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      // Safe (anon-visible) columns. Avoid `*` because anon lacks SELECT on `contact`/`contact_name`.
      const safeCols = "id, user_id, category, title, description, make, model, year, condition, transmission, fuel, mileage, body_type, colour, engine, vin, registration_status, registration_year, region, district, price, negotiable, status, cover_photo_url, rejection_reason, closed_reason, created_at, updated_at";
      const cols = user ? `${safeCols}, contact, contact_name` : safeCols;
      const { data: rawData, error } = await (supabase
        .from("listings") as any)
        .select(`${cols}, listing_photos(url, is_cover, sort_order)`)
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (error || !rawData) { setNotFound(true); setLoading(false); return; }
      const data: any = rawData;

      // Fetch profile + dealer info separately (no direct FK between listings <-> profiles).
      // Anon can only see safe profile columns (full_name); phone/whatsapp are restricted.
      const profileCols = user ? "full_name, phone, whatsapp_enabled, whatsapp_number" : "full_name";
      const [{ data: prof }, { data: deal }] = await Promise.all([
        supabase.from("profiles").select(profileCols).eq("id", data.user_id).maybeSingle(),
        supabase.from("dealer_profiles").select("business_name, region, status").eq("user_id", data.user_id).maybeSingle(),
      ]);

      const enriched: any = { ...data, profiles: prof ?? null, dealer_profiles: deal ?? null };
      setListing(enriched);

      const sorted = [...(data.listing_photos ?? [])].sort((a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
      const paths = sorted.length ? sorted.map((p: any) => p.url) : data.cover_photo_url ? [data.cover_photo_url] : [];
      const signed = (await signedUrls("listing-photos", paths)).filter(Boolean) as string[];
      if (!alive) return;
      setPhotos(signed);
      setLoading(false);
      // fire-and-forget view increment
      supabase.rpc("increment_listing_stat", { _listing_id: id, _field: "views" });
    };
    load();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!user || !listing) return;
    let alive = true;
    supabase.from("saved_listings").select("id").eq("user_id", user.id).eq("listing_id", listing.id).maybeSingle()
      .then(({ data }) => { if (alive) setSaved(!!data); });
    return () => { alive = false; };
  }, [user, listing]);

  const toggleSave = async () => {
    if (!user) { toast.error("Sign in to save listings"); return; }
    if (saved) {
      await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setSaved(false);
    } else {
      await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: listing.id });
      setSaved(true);
      toast.success("Saved");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8"><div className="aspect-video animate-pulse rounded-xl bg-muted" /></div>
    </div>
  );
  if (notFound || !listing) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Listing not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    </div>
  );

  const phone = listing.contact || listing.profiles?.phone;
  const dealerVerified = listing.dealer_profiles?.status === "approved";
  const contactDisplayName = listing.contact_name || listing.dealer_profiles?.business_name || listing.profiles?.full_name || "Dealer";
  const dealerName = listing.dealer_profiles?.business_name || listing.profiles?.full_name || "Dealer";

  const onCallClick = () => {
    supabase.rpc("increment_listing_stat", { _listing_id: id, _field: "phone_clicks" });
  };
  const onRevealPhone = () => {
    if (!user) { openAuth("choose"); return; }
    setShowPhone(true);
    supabase.rpc("increment_listing_stat", { _listing_id: id, _field: "phone_clicks" });
  };
  const onRevealWa = () => {
    if (!user) { openAuth("choose"); return; }
    setShowWa(true);
    supabase.rpc("increment_listing_stat", { _listing_id: id, _field: "phone_clicks" });
  };
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: listing.title, text: `Check out this ${listing.title} on AutoFie`, url };
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(shareData);
        return;
      }
    } catch { /* user cancelled */ return; }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not share link");
    }
  };
  const onChatClick = () => {
    if (!user) { openAuth("choose"); return; }
    if (user.id === listing.user_id) { toast.error("You can't message yourself"); return; }
    supabase.rpc("increment_listing_stat", { _listing_id: id, _field: "chat_clicks" });
    navigate({ to: "/chat/$listingId/$otherId", params: { listingId: listing.id, otherId: listing.user_id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Gallery + specs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="overflow-hidden rounded-xl border bg-muted">
              {photos[coverIdx] ? (
                <img src={photos[coverIdx]} alt={listing.title} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-sm text-muted-foreground">No photo</div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                {photos.map((src, i) => (
                  <button key={i} onClick={() => setCoverIdx(i)} className={`aspect-square overflow-hidden rounded-md border-2 ${i === coverIdx ? "border-primary" : "border-transparent"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl border bg-card p-5">
              <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
              <p className="mt-2 text-3xl font-extrabold text-primary">{formatGHS(listing.price)}{listing.negotiable && <span className="ml-2 text-sm font-medium text-muted-foreground">negotiable</span>}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Spec icon={<Calendar className="h-4 w-4" />} label="Year" value={listing.year} />
                <Spec icon={<Gauge className="h-4 w-4" />} label="Mileage" value={formatMileage(listing.mileage)} />
                <Spec icon={<Settings className="h-4 w-4" />} label="Transmission" value={listing.transmission} />
                <Spec icon={<Fuel className="h-4 w-4" />} label="Fuel" value={listing.fuel} />
                <Spec icon={<Palette className="h-4 w-4" />} label="Colour" value={listing.colour} />
                <Spec icon={<MapPin className="h-4 w-4" />} label="Location" value={[listing.district, listing.region].filter(Boolean).join(", ")} />
                <Spec label="Make" value={listing.make} />
                <Spec label="Model" value={listing.model} />
                <Spec label="Body" value={listing.body_type} />
                <Spec label="Condition" value={listing.condition} />
                <Spec label="Engine" value={listing.engine} />
                <Spec label="Registration" value={listing.registration_status} />
                <Spec label="Year of registration" value={listing.registration_year} />
              </div>

              {listing.description && (
                <>
                  <h2 className="mt-6 text-lg font-semibold">Description</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{listing.description}</p>
                </>
              )}
            </div>
          </div>

          {/* Dealer card */}
          <aside className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary">{initialsOf(contactDisplayName)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-foreground">
                    {contactDisplayName}
                    {dealerVerified && <BadgeCheck className="h-4 w-4 text-success" />}
                  </p>
                  {listing.contact_name && dealerName !== contactDisplayName && (
                    <p className="text-xs text-muted-foreground">{dealerName}</p>
                  )}
                  {user && phone && <p className="text-sm text-muted-foreground">{phone}</p>}
                  {dealerVerified && <Badge variant="outline" className="mt-1 border-success/30 bg-success/10 text-success">Verified dealer</Badge>}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {/* Phone: hidden until revealed (sign-in required) */}
                {user && phone ? (
                  showPhone ? (
                    <a href={`tel:${phone}`} onClick={onCallClick}>
                      <Button className="w-full"><Phone className="mr-2 h-4 w-4" />{phone}</Button>
                    </a>
                  ) : (
                    <Button className="w-full" onClick={onRevealPhone}>
                      <Eye className="mr-2 h-4 w-4" />Show contact
                    </Button>
                  )
                ) : (
                  <Button className="w-full" onClick={onRevealPhone}>
                    <Eye className="mr-2 h-4 w-4" />Show contact
                  </Button>
                )}

                {/* WhatsApp: hidden until revealed */}
                {user ? (
                  listing.profiles?.whatsapp_enabled && listing.profiles?.whatsapp_number ? (
                    showWa ? (
                      <a href={`https://wa.me/${listing.profiles.whatsapp_number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in your ${listing.title} on AutoFie.`)}`}
                         target="_blank" rel="noopener noreferrer" onClick={onCallClick}>
                        <Button variant="outline" className="w-full border-success text-success hover:bg-success/10 hover:text-success">
                          <MessageCircle className="mr-2 h-4 w-4" />WhatsApp
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" className="w-full border-success text-success hover:bg-success/10 hover:text-success" onClick={onRevealWa}>
                        <Eye className="mr-2 h-4 w-4" />Show WhatsApp number
                      </Button>
                    )
                  ) : null
                ) : (
                  <Button variant="outline" className="w-full border-success text-success hover:bg-success/10 hover:text-success" onClick={onRevealWa}>
                    <Eye className="mr-2 h-4 w-4" />Show WhatsApp number
                  </Button>
                )}

                <Button variant="outline" className="w-full" onClick={onChatClick}>
                  <MessageCircle className="mr-2 h-4 w-4" />Chat on AutoFie
                </Button>
                <Button variant="outline" className="w-full" onClick={onShare}>
                  <Share2 className="mr-2 h-4 w-4" />Share listing
                </Button>
                <Button variant="ghost" className="w-full" onClick={toggleSave}>
                  <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon, label, value }: { icon?: React.ReactNode; label: string; value: any }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{icon}{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
