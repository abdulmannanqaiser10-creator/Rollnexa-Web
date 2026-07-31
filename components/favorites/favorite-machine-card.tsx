"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { FavoriteMachine } from "@/lib/favorites/types";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80";

type FavoriteMachineCardProps = {
  machine: FavoriteMachine;
};

export function FavoriteMachineCard({ machine }: FavoriteMachineCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeFavorite() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId: machine.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Unable to remove favorite");
        return;
      }
      setRemoved(true);
      router.refresh();
    } catch {
      setError("Unable to remove favorite. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (removed) return null;

  return (
    <article className="rn-card overflow-hidden">
      <div className="relative aspect-[4/3] bg-rn-surface">
        <Image
          src={machine.imageUrl || FALLBACK_IMAGE}
          alt={machine.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {!machine.available ? (
          <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
            {machine.listingStatus === "SOLD"
              ? "Sold"
              : "No longer available"}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-display text-lg font-bold text-rn-ink">
            {machine.title}
          </h3>
          <p className="mt-1 text-xs text-rn-muted">
            {[machine.brandName, machine.categoryName].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-rn-muted">
          {machine.year ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5 text-rn-gold" />
              {machine.year}
            </span>
          ) : null}
          <span className="rounded bg-rn-surface px-1.5 py-0.5 font-medium capitalize text-rn-charcoal">
            {machine.condition.toLowerCase()}
          </span>
        </div>

        {machine.location ? (
          <p className="inline-flex items-center gap-1 text-xs text-rn-muted">
            <MapPin className="size-3.5 text-rn-gold" />
            {machine.location}
          </p>
        ) : null}

        <p className="font-display text-xl font-bold text-rn-ink">
          {formatPrice(machine.price)}
        </p>

        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-black/5 pt-3">
          {machine.available ? (
            <Link
              href={`/machines/${machine.slug}`}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-rn-ink px-3 text-xs font-semibold text-white transition hover:bg-rn-gold hover:text-rn-ink"
            >
              View Details
            </Link>
          ) : (
            <span className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-black/10 px-3 text-xs font-semibold text-rn-muted">
              Listing unavailable
            </span>
          )}
          <button
            type="button"
            onClick={removeFavorite}
            disabled={pending}
            aria-label="Remove from favorites"
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-black/10 px-3 text-xs font-semibold text-rn-ink hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            )}
          >
            <Trash2 className="size-3.5" />
            {pending ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}
