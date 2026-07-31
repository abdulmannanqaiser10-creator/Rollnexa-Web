import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock3, CalendarDays } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { HomeMachine } from "@/lib/home/types";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { CompareButton } from "@/components/compare/compare-button";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80";

type MachineCardProps = {
  machine: HomeMachine;
  compact?: boolean;
  className?: string;
  isAuthenticated?: boolean;
  isFavorited?: boolean;
  showFavorite?: boolean;
  showCompare?: boolean;
};

export function MachineCard({
  machine,
  compact = false,
  className,
  isAuthenticated = false,
  isFavorited = false,
  showFavorite = true,
  showCompare = true,
}: MachineCardProps) {
  return (
    <article
      className={cn(
        "rn-card-hover group overflow-hidden",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-rn-surface">
        <Image
          src={machine.imageUrl || FALLBACK_IMAGE}
          alt={machine.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rn-ink/35 via-transparent to-transparent opacity-80" />
        {!machine.imageUrl ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
            No photo
          </span>
        ) : null}
        {machine.isPremium ? (
          <span className="rn-badge-gold absolute top-3 left-3 shadow-sm">
            Premium
          </span>
        ) : null}
        {machine.categoryName ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold tracking-wide text-rn-ink uppercase shadow-sm">
            {machine.categoryName}
          </span>
        ) : null}
        {(showFavorite || showCompare) && (
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            {showFavorite ? (
              <FavoriteButton
                machineId={machine.id}
                initialFavorited={isFavorited}
                isAuthenticated={isAuthenticated}
                variant="icon"
              />
            ) : null}
            {showCompare ? (
              <CompareButton
                variant="icon"
                machine={{
                  id: machine.id,
                  slug: machine.slug,
                  title: machine.title,
                  priceLabel: formatPrice(machine.price),
                  brandName: machine.brandName,
                  year: machine.year,
                  imageUrl: machine.imageUrl,
                  categoryName: machine.categoryName,
                  condition: machine.condition,
                  location: machine.location,
                }}
              />
            ) : null}
          </div>
        )}
      </div>

      <div className={cn("space-y-3 p-4", compact && "p-3")}>
        <div>
          {machine.brandName ? (
            <p className="text-[11px] font-semibold tracking-wide text-rn-gold uppercase">
              {machine.brandName}
            </p>
          ) : null}
          <h3 className="mt-0.5 line-clamp-1 font-display text-lg font-bold text-rn-ink">
            {machine.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-rn-muted">
          {machine.year ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5 text-rn-gold" />
              {machine.year}
            </span>
          ) : null}
          {machine.hours != null ? (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5 text-rn-gold" />
              {machine.hours.toLocaleString()} hrs
            </span>
          ) : null}
          <span className="rn-badge-muted capitalize">
            {machine.condition.toLowerCase()}
          </span>
        </div>

        {machine.location ? (
          <p className="inline-flex items-center gap-1 text-xs text-rn-muted">
            <MapPin className="size-3.5 text-rn-gold" />
            {machine.location}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-3">
          <p className="font-display text-xl font-bold text-rn-ink">
            {formatPrice(machine.price)}
          </p>
          <Link
            href={`/machines/${machine.slug}`}
            className="rounded-lg bg-rn-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-rn-gold hover:text-rn-ink"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
