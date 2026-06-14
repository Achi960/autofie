import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, MapPin, Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { initialsOf } from "@/lib/format";
import { isOnline, lastSeenLabel } from "@/lib/presence";

type Profile = {
  full_name: string | null;
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

export function ProfileDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [listingCount, setListingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const [{ data: p }, { data: d }, { count }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_url, last_seen_at, created_at").eq("id", userId).maybeSingle(),
        supabase.from("dealer_profiles").select("business_name, region, district, status").eq("user_id", userId).maybeSingle(),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "approved"),
      ]);
      if (!alive) return;
      setProfile((p as Profile) ?? null);
      setDealer((d as Dealer) ?? null);
      setListingCount(count ?? 0);
      if (p?.avatar_url) signedUrl("avatars", p.avatar_url).then((u) => alive && setAvatarSrc(u));
      else setAvatarSrc(null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [open, userId]);

  const name = dealer?.business_name || profile?.full_name || "User";
  const verified = dealer?.status === "approved";
  const online = isOnline(profile?.last_seen_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Profile</DialogTitle></DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">{initialsOf(name)}</AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card ${online ? "bg-success" : "bg-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold text-foreground">
                  {name}
                  {verified && <BadgeCheck className="h-4 w-4 text-success" />}
                </p>
                {dealer?.business_name && profile?.full_name && dealer.business_name !== profile.full_name && (
                  <p className="truncate text-xs text-muted-foreground">{profile.full_name}</p>
                )}
                <p className={`text-xs ${online ? "text-success" : "text-muted-foreground"}`}>
                  {lastSeenLabel(profile?.last_seen_at)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {verified && <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Verified dealer</Badge>}
              <Badge variant="outline">{listingCount} active listing{listingCount === 1 ? "" : "s"}</Badge>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              {profile?.phone && (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${profile.phone}`} className="hover:underline">{profile.phone}</a>
                </div>
              )}
              {(dealer?.region || dealer?.district) && (
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {[dealer?.district, dealer?.region].filter(Boolean).join(", ")}
                </div>
              )}
              {profile?.created_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
