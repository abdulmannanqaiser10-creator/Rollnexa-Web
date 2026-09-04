import { MachineCardSkeleton } from "@/components/machines/machine-card-skeleton";

export default function HomeLoading() {
  return (
    <div className="bg-rn-surface">
      <div className="h-[70vh] min-h-[420px] animate-pulse bg-rn-ink/90" />
      <div className="rn-container space-y-10 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-black/10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <MachineCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
