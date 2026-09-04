"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  machineId: string;
  initialFavorited?: boolean;
  isAuthenticated: boolean;
  variant?: "button" | "icon";
  className?: string;
  onChanged?: (favorited: boolean) => void;
};

export function FavoriteButton({
  machineId,
  initialFavorited = false,
  isAuthenticated,
  variant = "button",
  className,
  onChanged,
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (pending) return;

    const previous = favorited;
    setPending(true);
    setError(null);
    setFeedback(null);
    // Optimistic update
    setFavorited(!previous);

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFavorited(previous);
        setError(result?.error || "Unable to update favorites");
        return;
      }

      const next = Boolean(result.favorited);
      setFavorited(next);
      setFeedback(next ? "Saved to favorites" : "Removed from favorites");
      onChanged?.(next);
      router.refresh();
      window.setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFavorited(previous);
      setError("Unable to update favorites. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (variant === "icon") {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorited}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-rn-ink shadow-sm transition hover:bg-rn-gold disabled:opacity-60",
            favorited && "text-red-600"
          )}
        >
          <Heart className={cn("size-4", favorited && "fill-current")} />
        </button>
        {error ? (
          <span className="absolute top-full right-0 z-10 mt-1 whitespace-nowrap rounded bg-red-50 px-2 py-1 text-[10px] text-red-700">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorited}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition disabled:opacity-60",
          favorited
            ? "border-rn-gold bg-rn-gold/15 text-rn-ink"
            : "border-rn-ink/10 bg-white text-rn-ink hover:border-rn-gold"
        )}
      >
        <Heart className={cn("size-4", favorited && "fill-current")} />
        {pending
          ? favorited
            ? "Saving..."
            : "Updating..."
          : favorited
            ? "Saved to Favorites"
            : "Add to Favorites"}
      </button>
      {feedback ? (
        <p className="text-xs font-medium text-emerald-700">{feedback}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
