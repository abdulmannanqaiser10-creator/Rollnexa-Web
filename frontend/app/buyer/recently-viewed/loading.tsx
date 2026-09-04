import { MachineCardSkeleton } from "@/components/machines/machine-card-skeleton";

export default function BuyerRecentlyViewedLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-black/10" />
        <div className="h-8 w-72 animate-pulse rounded bg-black/10" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-black/10" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MachineCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
