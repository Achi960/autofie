import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, MapPin, Phone, Clock, UserPlus, UserCheck, ArrowLeft, Inbox, Share2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { ReviewsSection } from "@/components/ReviewsSection";
import { DealerLink } from "@/components/ListingLink";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { initialsOf } from "@/lib/format";
import { isOnline, lastSeenLabel } from "@/lib/presence";
import { useAuth } from "@/lib/auth-context";
import { dealerUrl } from "@/lib/urls";
import { toast } from "sonner";

type Profile = {
  full_name: string | null;
  handle: string | null;
  public_code: string | null;
  phone: string | null;
  avatar_url: string | null;
  last_seen_at: string | null;
  created_at: string | null;
};
type Dealer = {
  business_name: string | null;
  region: string | null;
  district: string | null;
  status: string | null;
};
type MiniUser = { id: string; full_name: string | null; avatar_url: string | null; handle?: string | null };

/** Public seller/shop page, addressed by the seller's database id. */
export function DealerProfile({ id }: { id: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [listOpen, setListOpen] = useState<null | "followers" | "following">(null);
  const [listUsers, setListUsers] = useState<MiniUser[]>([]);

  const isSelf = user?.id === id;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: d }, { data: lst }, { data: fcount }, { data: gcount }] = await Promise.all([
        supabase.from("profiles").select("full_name, handle, public_code, phone, avatar_url, last_seen_at, created_at").eq("id", id).maybeSingle(),
        supabase.from("dealer_profiles").select("business_name, region, district, status").eq("user_id", id).maybeSingle(),
        supabase.from("listings").select("id, slug, title, price, region, condition, transmission, mileage, cover_photo_url, category, make, year").eq("user_id", id).eq("status", "approved").order("created_at", { ascending: false }),
        supabase.rpc("follower_count", { _user_id: id }),
        supabase.rpc("following_count", { _user_id: id }),
      ]);
      if (!alive) return;
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProfile(p as Profile);
      setDealer((d as Dealer) ?? null);
      setListings((lst as ListingCardData[]) ?? []);
      setFollowers((fcount as unknown as number) ?? 0);
      setFollowing((gcount as unknown as number) ?? 0);
      if ((p as Profile).avatar_url) signedUrl("avatars", (p as Profile).avatar_url!).then((u) => alive && setAvatarSrc(u));

      if (user && !isSelf) {
        const { data: f } = await supabase.rpc("is_following", { _follower: user.id, _dealer: id });
        if (alive) setIsFollowing(!!f);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id, user?.id, isSelf, user]);

  const toggleFollow = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isSelf || busy) return;
    setBusy(true);
    if (isFollowing) {
      const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("dealer_id", id);
      if (error) toast.error(error.message);
      else { setIsFollowing(false); setFollowers((n) => Math.max(0, n - 1)); }
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, dealer_id: id });
      if (error) toast.error(error.message);
      else { setIsFollowing(true); setFollowers((n) => n + 1); toast.success("Following"); }
    }
    setBusy(false);
  };

  const openList = async (kind: "followers" | "following") => {
    setListOpen(kind);
    setListUsers([]);
    const fn = kind === "followers" ? "list_followers" : "list_following";
    const { data } = await supabase.rpc(fn, { _user_id: id });
    setListUsers((data as MiniUser[]) ?? []);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <p className="mx-auto max-w-5xl px-4 py-12 text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }
  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back home</Link>
        </div>
      </div>
    );
  }

  const name = dealer?.business_name || profile.full_name || "User";
  const verified = dealer?.status === "approved";
  const online = isOnline(profile.last_seen_at);
  const memberSince = profile.created_at ? new Date(profile.created_at) : null;
  const yearsActive = memberSince ? Math.max(0, Math.floor((Date.now() - memberSince.getTime()) / (365.25 * 24 * 3600 * 1000))) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header banner */}
      <div className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <button onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: "/" })}
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-card shadow-md">
                {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">{initialsOf(name)}</AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card ${online ? "bg-success" : "bg-muted-foreground"}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-foreground">{name}</h1>
                {verified && <BadgeCheck className="h-6 w-6 text-success" aria-label="Verified dealer" />}
              </div>
              {dealer?.business_name && profile.full_name && dealer.business_name !== profile.full_name && (
                <p className="text-sm text-muted-foreground">{profile.full_name}</p>
              )}
              <p className={`mt-0.5 text-sm ${online ? "text-success" : "text-muted-foreground"}`}>
                {lastSeenLabel(profile.last_seen_at)}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile.public_code && <Badge variant="outline" className="font-mono">{profile.public_code}</Badge>}
                {verified && <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Verified dealer</Badge>}
                {(dealer?.region || dealer?.district) && (
                  <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{[dealer?.district, dealer?.region].filter(Boolean).join(", ")}</Badge>
                )}
                {memberSince && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {yearsActive >= 1 ? `${yearsActive} year${yearsActive === 1 ? "" : "s"} on AutoFie` : `Joined ${memberSince.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isSelf && (
                <Button onClick={toggleFollow} disabled={busy} variant={isFollowing ? "outline" : "default"}>
                  {isFollowing ? <><UserCheck className="mr-1.5 h-4 w-4" />Following</> : <><UserPlus className="mr-1.5 h-4 w-4" />Follow</>}
                </Button>
              )}
              {!isSelf && user && profile.phone && (
                <Button asChild variant="outline" size="icon">
                  <a href={`tel:${profile.phone}`} aria-label="Call"><Phone className="h-4 w-4" /></a>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={async () => {
                  const url = dealerUrl(profile.handle, id);
                  const shareData = { title: `${name} on AutoFie`, text: `Check out ${name}'s shop on AutoFie`, url };
                  try {
                    if (navigator.share) await navigator.share(shareData);
                    else { await navigator.clipboard.writeText(url); toast.success("Shop link copied"); }
                  } catch { /* user cancelled */ }
                }}
              >
                <Share2 className="mr-1.5 h-4 w-4" />Share shop
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-xl font-bold text-foreground">{listings.length}</p>
              <p className="text-xs text-muted-foreground">Listings</p>
            </div>
            <button onClick={() => openList("followers")} className="rounded-lg border bg-card p-3 text-center hover:bg-muted/40">
              <p className="text-xl font-bold text-foreground">{followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </button>
            <button onClick={() => openList("following")} className="rounded-lg border bg-card p-3 text-center hover:bg-muted/40">
              <p className="text-xl font-bold text-foreground">{following}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">
          {isSelf ? "Your listings" : `Listings by ${name}`}
        </h2>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">No ads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSelf ? "When you post a vehicle, it will show up here." : `${name} hasn't posted any ads yet.`}
            </p>
            {isSelf && (
              <Button asChild className="mt-4"><Link to="/submit-listing">Post your first ad</Link></Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={{ ...l, dealer_name: name, dealer_verified: verified }} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <ReviewsSection dealerId={id} dealerName={name} />
      </div>

      <Dialog open={!!listOpen} onOpenChange={(v) => !v && setListOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{listOpen === "followers" ? "Followers" : "Following"}</DialogTitle>
          </DialogHeader>
          {listUsers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {listOpen === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {listUsers.map((u) => (
                <li key={u.id}>
                  <DealerLink handle={u.handle} userId={u.id} onClick={() => setListOpen(null)}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">{initialsOf(u.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium text-foreground">{u.full_name || "User"}</span>
                  </DealerLink>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
