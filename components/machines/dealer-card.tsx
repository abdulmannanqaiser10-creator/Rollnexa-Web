import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { HomeDealer } from "@/lib/home/types";

type DealerCardProps = {
  dealer: HomeDealer;
};

export function DealerCard({ dealer }: DealerCardProps) {
  const initials = dealer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rn-card flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rn-ink text-sm font-bold text-rn-gold">
          {dealer.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dealer.image} alt={dealer.name} className="size-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold text-rn-ink">{dealer.name}</h3>
          {dealer.verified ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <BadgeCheck className="size-3.5" />
              Verified Dealer
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-rn-muted">
        <span className="inline-flex items-center gap-1 font-semibold text-rn-ink">
          <Star className="size-4 fill-rn-gold text-rn-gold" />
          {dealer.rating.toFixed(1)}
        </span>
        <span>{dealer.listingCount} listings</span>
      </div>

      {(dealer.city || dealer.country) && (
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-rn-muted">
          <MapPin className="size-3.5 text-rn-gold" />
          {[dealer.city, dealer.country].filter(Boolean).join(", ")}
        </p>
      )}

      <Link
        href={`/dealers/${dealer.id}`}
        className="mt-5 inline-flex items-center justify-center rounded-lg border border-rn-ink/10 px-4 py-2.5 text-sm font-semibold text-rn-ink transition hover:border-rn-gold hover:bg-rn-gold"
      >
        View Profile
      </Link>
    </article>
  );
}
