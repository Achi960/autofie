import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrls } from "@/lib/storage";
import { formatGHS, formatMileage } from "@/lib/format";
import { LISTING_REJECTION_REASONS } from "@/lib/ghana";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Fuel, Gauge, MapPin, Palette, Settings, Phone, User as UserIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/listing/$id")({
  component: AdminListingReview,
});

function AdminListingReview() {
  const { id } = Route.useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<any | null>(null);
  const [dealer, setDealer] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cover, setCover] = useState(0);
  const [acting, setActing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) { toast.error("Admins only"); navigate({ to: "/" }); }
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("listings").select("*, listing_photos(url, is_cover, sort_order)").eq("id", id).maybeSingle();
    if (error || !data) { toast.error("Listing not found"); navigate({ to: "/admin/listings" }); return; }
    setListing(data);

    const [{ data: prof }, { data: dlr }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", data.user_id).maybeSingle(),
      supabase.from("dealer_profiles").select("*").eq("user_id", data.user_id).maybeSingle(),
    ]);
    setProfile(prof);
    setDealer(dlr);

    const sorted = [...(data.listing_photos ?? [])].sort((a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
    const paths = sorted.length ? sorted.map((p: any) => p.url) : data.cover_photo_url ? [data.cover_photo_url] : [];
    const signed = (await signedUrls("listing-photos", paths)).filter(Boolean) as string[];
    setPhotos(signed);
    setCover(0);
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [id, isAdmin]);

  const approve = async () => {
    setActing(true);
    const { error } = await supabase.from("listings").update({ status: "approved", rejection_reason: null }).eq("id", id);
    setActing(false);
    if (error) return toast.error(error.message);
    toast.success("Listing approved");
    navigate({ to: "/admin/listings" });
  };
  const reject = async (reason: string) => {
    setActing(true);
    const { error } = await supabase.from("listings").update({ status: "rejected", rejection_reason: reason }).eq("id", id);
    setActing(false); setRejecting(false);
    if (error) return toast.error(error.message);
    toast.success("Listing rejected");
    navigate({ to: "/admin/listings" });
  };

  if (loading || !listing) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground">Loading…</div>
    </div>
  );

  const statusColor = listing.status === "approved" ? "bg-success text-success-foreground"
    : listing.status === "rejected" ? "bg-destructive text-destructive-foreground"
    : "bg-primary text-primary-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/admin/listings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to pending listings
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge className={statusColor}>{listing.status}</Badge>
              {listing.negotiable && <Badge variant="outline">Negotiable</Badge>}
              <span className="text-xs text-muted-foreground">Submitted {new Date(listing.created_at).toLocaleString()}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold">{listing.title}</h1>
            <p className="mt-1 text-2xl font-bold text-primary">{formatGHS(listing.price)}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/listing/$id" params={{ id: listing.id }}><Button variant="outline">Open public page</Button></Link>
            {listing.status !== "approved" && (
              <Button onClick={approve} disabled={acting} className="bg-success text-success-foreground hover:bg-success/90">
                {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Approve
              </Button>
            )}
            {listing.status !== "rejected" && (
              <Button variant="outline" onClick={() => setRejecting(true)} disabled={acting} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Reject
              </Button>
            )}
          </div>
        </div>

        {listing.rejection_reason && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <strong>Rejected:</strong> {listing.rejection_reason}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="aspect-video w-full bg-muted">
                {photos[cover] ? <img src={photos[cover]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No photo</div>}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-2">
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => setCover(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded border-2 ${i === cover ? "border-primary" : "border-transparent"}`}>
                      <img src={p} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">Vehicle details</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Spec icon={<Calendar className="h-4 w-4" />} label="Year" value={listing.year} />
                <Spec icon={<Gauge className="h-4 w-4" />} label="Mileage" value={formatMileage(listing.mileage)} />
                <Spec label="Make" value={listing.make} />
                <Spec label="Model" value={listing.model} />
                <Spec label="Condition" value={listing.condition} />
                <Spec label="Body" value={listing.body_type} />
                <Spec icon={<Settings className="h-4 w-4" />} label="Transmission" value={listing.transmission} />
                <Spec icon={<Fuel className="h-4 w-4" />} label="Fuel" value={listing.fuel} />
                <Spec icon={<Palette className="h-4 w-4" />} label="Colour" value={listing.colour} />
                <Spec label="Engine" value={listing.engine} />
                <Spec label="Registration" value={listing.registration_status} />
                {listing.registration_year && <Spec label="Year of registration" value={listing.registration_year} />}
                <Spec icon={<MapPin className="h-4 w-4" />} label="Location" value={`${listing.region ?? ""}${listing.district ? ", " + listing.district : ""}`} />
              </div>
            </div>

            {listing.description && (
              <div className="rounded-xl border bg-card p-4">
                <h2 className="font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{listing.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">Seller contact</h2>
              <div className="mt-3 space-y-2 text-sm">
                <Row icon={<UserIcon className="h-4 w-4" />} value={listing.contact_name ?? profile?.full_name ?? "—"} />
                <Row icon={<Phone className="h-4 w-4" />} value={listing.contact ?? profile?.phone ?? "—"} />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">Account</h2>
              <div className="mt-3 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name: </span>{profile?.full_name ?? "—"}</p>
                <p><span className="text-muted-foreground">Phone: </span>{profile?.phone ?? "—"}</p>
                <p className="break-all"><span className="text-muted-foreground">User ID: </span>{listing.user_id}</p>
              </div>
            </div>

            {dealer && (
              <div className="rounded-xl border bg-card p-4">
                <h2 className="font-semibold">Dealer profile</h2>
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Business: </span>{dealer.business_name ?? "—"}</p>
                  <p><span className="text-muted-foreground">Region: </span>{dealer.region ?? "—"}</p>
                  <p><span className="text-muted-foreground">Status: </span><Badge variant="outline">{dealer.status}</Badge></p>
                </div>
                <Link to="/admin/dealers" className="mt-3 inline-block text-sm text-primary hover:underline">Open dealer reviews →</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject "{listing.title}"</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {LISTING_REJECTION_REASONS.map((r) => (
              <Button key={r} variant="outline" className="w-full justify-start" onClick={() => reject(r)} disabled={acting}>{r}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Spec({ icon, label, value }: { icon?: React.ReactNode; label: string; value: any }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <span><span className="text-muted-foreground">{label}: </span><span className="font-medium">{value}</span></span>
    </div>
  );
}
function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <div className="flex items-center gap-2"><span className="text-muted-foreground">{icon}</span><span>{value}</span></div>;
}
