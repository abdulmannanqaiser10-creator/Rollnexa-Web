import Link from "next/link";
import { MapPin, MessageSquare, Star } from "lucide-react";
import { PremiumBadge } from "@/components/subscriptions/PremiumBadge";
import type { MachineDetailSeller } from "@/lib/machines/detail";

type SellerCardProps = {
  seller: MachineDetailSeller;
  onContactHref?: string;
};

export function SellerCard({ seller }: SellerCardProps) {
  const location = [seller.city, seller.country].filter(Boolean).join(", ");
  const displayName = seller.companyName || seller.name;

  return (
    <section className="rn-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-rn-ink">Seller Information</h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative size-14 overflow-hidden rounded-full bg-rn-surface">
            {seller.avatar ? (
              // Avatar hosts vary; native img avoids remotePatterns failures.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seller.avatar}
                alt={displayName}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-lg font-bold text-rn-muted">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-rn-ink">{displayName}</p>
            {seller.isPremiumSeller ? (
              <div className="mt-1">
                <PremiumBadge />
              </div>
            ) : null}
            {seller.isDealerProfile ? (
              <p className="mt-1 text-xs font-semibold text-rn-gold">Verified Dealer Profile</p>
            ) : null}
            {seller.companyName && seller.name !== seller.companyName ? (
              <p className="text-sm text-rn-muted">{seller.name}</p>
            ) : null}
            {location ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-rn-muted">
                <MapPin className="size-3.5 text-rn-gold" />
                {location}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-rn-muted">
              {seller.listingCount} active listing{seller.listingCount === 1 ? "" : "s"}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-rn-muted">
              <Star className="size-3.5 text-rn-gold" />
              {seller.totalReviews > 0
                ? `${seller.averageRating.toFixed(1)} (${seller.totalReviews} review${seller.totalReviews === 1 ? "" : "s"})`
                : "No seller reviews yet"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dealers/${seller.id}`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-rn-ink/10 px-4 text-sm font-semibold text-rn-ink hover:border-rn-gold"
          >
            View Seller Profile
          </Link>
          <a
            href="#contact-seller"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-rn-ink px-4 text-sm font-bold text-white hover:bg-rn-gold hover:text-rn-ink"
          >
            <MessageSquare className="size-4" />
            Contact Seller
          </a>
        </div>
      </div>
    </section>
  );
}
