import Link from "next/link";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getRecentlyViewedMachines } from "@/lib/recently-viewed/query";
import { RecentlyViewedCard } from "@/components/recently-viewed/recently-viewed-card";
import { ClearRecentlyViewedButton } from "@/components/recently-viewed/clear-recently-viewed-button";

export const metadata = {
  title: "Recently Viewed Machines — Rollnexa",
  description:
    "Continue exploring the heavy equipment listings you recently viewed on Rollnexa.",
};

export default async function BuyerRecentlyViewedPage() {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login?callbackUrl=/buyer/recently-viewed");

  let items: Awaited<ReturnType<typeof getRecentlyViewedMachines>>["items"] =
    [];
  let total = 0;
  let loadFailed = false;

  try {
    const result = await getRecentlyViewedMachines(session.user.id);
    items = result.items;
    total = result.total;
  } catch (error) {
    console.error("[buyer/recently-viewed] Failed:", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rn-eyebrow">Browsing History</p>
          <h2 className="rn-page-title text-2xl sm:text-3xl">
            Recently Viewed Machines
          </h2>
          <p className="mt-2 max-w-xl text-sm text-rn-muted">
            Continue exploring the machines you recently viewed.
          </p>
          {!loadFailed && total > 0 ? (
            <p className="mt-2 text-sm text-rn-muted">
              {total} machine{total === 1 ? "" : "s"} in your history
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {items.length > 0 ? <ClearRecentlyViewedButton /> : null}
          <Link href="/machines" className="rn-btn-primary">
            Browse Machines
          </Link>
        </div>
      </div>

      {loadFailed ? (
        <div className="rn-panel text-center">
          <h3 className="font-display text-xl font-bold text-rn-ink">
            Unable to load recently viewed
          </h3>
          <p className="mt-2 text-sm text-rn-muted">
            Please try again in a moment.
          </p>
          <Link href="/buyer/recently-viewed" className="rn-btn-primary mt-5">
            Retry
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="rn-panel text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-rn-ink/5">
            <History className="size-6 text-rn-muted" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-rn-ink">
            No recently viewed machines.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-rn-muted">
            Machines you view will appear here so you can easily continue
            exploring them later.
          </p>
          <Link href="/machines" className="rn-btn-primary mt-5">
            Browse Machines
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((machine) => (
            <RecentlyViewedCard key={machine.recordId} machine={machine} />
          ))}
        </div>
      )}
    </div>
  );
}
