import { useEffect, useState } from "react";
import { ListingLink } from "@/components/ListingLink";
import { Heart, MapPin, Gauge, Settings, BadgeCheck, Calendar, Tag } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatGHS, formatMileage, initialsOf } from "@/lib/format";
import { signedUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { fieldsFor } from "@/lib/category-fields";
import type { CategorySlug } from "@/lib/ghana";

export interface ListingCardData {
  id: string;
  slug?: string | null;
  title: string;
  price: number;
  region: string | null;
  condition: string | null;
  transmission: string | null;
  mileage: number | null;
  cover_photo_url: string | null;
  views?: number;
  dealer_name?: string | null;
  dealer_verified?: boolean;
  category?: CategorySlug | string | null;
  make?: string | null;
  year?: number | null;
}

export function ListingCard({
  listing,
  isSaved = false,
  onToggleSave,
}: {
  listing: ListingCardData;
  isSaved?: boolean;
  onToggleSave?: () => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    signedUrl("listing-photos", listing.cover_photo_url).then((u) => {
      if (alive) setPhoto(u);
    });
    return () => { alive = false; };
  }, [listing.cover_photo_url]);

  const popular = (listing.views ?? 0) > 50;
  const cfg = fieldsFor((listing.category ?? "") as CategorySlug | "");

  return (
    <article className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <ListingLink
        listing={listing}
        className="block relative aspect-[4/3] overflow-hidden bg-muted"
      >
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            width={640}
            height={480}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-muted" />
        )}
        {popular && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">Popular</Badge>
        )}
        {onToggleSave && (
          <button
            type="button"
            aria-label={isSaved ? "Remove from saved" : "Save listing"}
            onClick={(e) => { e.preventDefault(); onToggleSave(); }}
            className="absolute right-2 top-2 rounded-full bg-white/95 p-2 shadow-sm transition hover:scale-105"
          >
            <Heart className={cn("h-4 w-4", isSaved ? "fill-primary text-primary" : "text-foreground")} />
          </button>
        )}
      </ListingLink>

      <div className="p-3">
        <p className="text-lg font-bold text-primary">{formatGHS(listing.price)}</p>
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          <ListingLink listing={listing}>{listing.title}</ListingLink>
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.region && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />{listing.region}
            </span>
          )}
          {listing.condition && cfg.condition && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{listing.condition}</span>
          )}
          {cfg.year && listing.year && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />{listing.year}
            </span>
          )}
          {cfg.transmission && listing.transmission && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Settings className="h-3 w-3" />{listing.transmission}
            </span>
          )}
          {cfg.mileage && listing.mileage != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Gauge className="h-3 w-3" />{formatMileage(listing.mileage)}
            </span>
          )}
          {!cfg.vehicle && listing.make && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Tag className="h-3 w-3" />{listing.make}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{initialsOf(listing.dealer_name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">{listing.dealer_name ?? "Dealer"}</span>
            {listing.dealer_verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-success" aria-label="Verified dealer" />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
