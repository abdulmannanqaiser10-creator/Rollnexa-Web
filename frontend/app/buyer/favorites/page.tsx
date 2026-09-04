import Link from "next/link";
import { Heart } from "lucide-react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getBuyerFavorites } from "@/lib/favorites/query";
import { FavoriteMachineCard } from "@/components/favorites/favorite-machine-card";

export const metadata = {
  title: "My Favorites — Rollnexa",
  description: "View machines you have saved on Rollnexa.",
};

export default async function BuyerFavoritesPage() {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login?callbackUrl=/buyer/favorites");

  let favorites: Awaited<ReturnType<typeof getBuyerFavorites>>["favorites"] =
    [];
  let total = 0;
  let loadFailed = false;

  try {
    const result = await getBuyerFavorites(session.user.id);
    favorites = result.favorites;
    total = result.total;
  } catch (error) {
    console.error("[buyer/favorites] Failed:", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rn-eyebrow">Saved Inventory</p>
          <h2 className="rn-page-title text-2xl sm:text-3xl">My Favorites</h2>
          <p className="mt-2 text-sm text-rn-muted">
            {loadFailed
              ? "Unable to load saved machines."
              : total === 0
                ? "Machines you save will appear here."
                : `${total} saved machine${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link href="/machines" className="rn-btn-primary">
          Browse Machines
        </Link>
      </div>

      {loadFailed ? (
        <div className="rn-panel text-center">
          <h3 className="font-display text-xl font-bold text-rn-ink">
            Unable to load favorites
          </h3>
          <p className="mt-2 text-sm text-rn-muted">
            Please try again in a moment.
          </p>
          <Link href="/buyer/favorites" className="rn-btn-primary mt-5">
            Retry
          </Link>
        </div>
      ) : favorites.length === 0 ? (
        <div className="rn-panel text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-rn-ink/5">
            <Heart className="size-6 text-rn-muted" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-rn-ink">
            You haven&apos;t saved any machines yet.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-rn-muted">
            When you find machines you&apos;re interested in, click the heart
            icon to save them here.
          </p>
          <Link href="/machines" className="rn-btn-primary mt-5">
            Browse Machines
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {favorites.map((machine) => (
            <FavoriteMachineCard key={machine.favoriteId} machine={machine} />
          ))}
        </div>
      )}
    </div>
  );
}
