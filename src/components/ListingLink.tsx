import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { categorySegment, makeSegment, type ListingRef } from "@/lib/urls";
import type { CategorySlug } from "@/lib/ghana";

const WITH_MAKE = ["car", "motorcycle", "bus", "truck", "heavy_equipment"];

/** Link to a listing's readable public page. */
export function ListingLink({
  listing,
  className,
  onClick,
  children,
}: {
  listing: ListingRef;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const category = categorySegment(listing.category);
  const slug = listing.slug || listing.id;

  if (WITH_MAKE.includes((listing.category ?? "") as CategorySlug)) {
    return (
      <Link
        to="/$category/$make/$slug"
        params={{ category, make: makeSegment(listing.make), slug }}
        className={className}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link to="/$category/$slug" params={{ category, slug }} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/** Link to a seller's public shop page. */
export function DealerLink({
  handle,
  userId,
  className,
  onClick,
  children,
}: {
  handle?: string | null;
  userId?: string | null;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (handle) {
    return (
      <Link to="/dealer/$handle" params={{ handle }} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/user/$id" params={{ id: userId ?? "" }} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
