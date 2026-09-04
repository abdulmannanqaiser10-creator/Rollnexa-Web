export default function MachineDetailLoading() {
  return (
    <div className="bg-rn-surface py-8 sm:py-12">
      <div className="rn-container space-y-8">
        <div className="h-4 w-64 animate-pulse rounded bg-black/10" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="aspect-[4/3] animate-pulse rounded-xl bg-black/10" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-black/10" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-black/10" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-black/10" />
            <div className="h-8 w-40 animate-pulse rounded bg-black/10" />
            <div className="flex gap-3">
              <div className="h-10 w-24 animate-pulse rounded-lg bg-black/10" />
              <div className="h-10 w-24 animate-pulse rounded-lg bg-black/10" />
              <div className="h-10 w-24 animate-pulse rounded-lg bg-black/10" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="h-11 animate-pulse rounded-lg bg-black/10" />
              <div className="h-11 animate-pulse rounded-lg bg-black/10" />
              <div className="h-11 animate-pulse rounded-lg bg-black/10" />
              <div className="h-11 animate-pulse rounded-lg bg-black/10" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-black/10" />
          <div className="h-48 animate-pulse rounded-xl bg-black/10" />
        </div>
        <div className="h-36 animate-pulse rounded-xl bg-black/10" />
      </div>
    </div>
  );
}
