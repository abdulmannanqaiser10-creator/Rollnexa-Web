export function MachineCardSkeleton() {
  return (
    <div className="rn-card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function MachineBrowseSkeleton() {
  return (
    <div className="bg-rn-surface py-10 sm:py-12">
      <div className="rn-container">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mb-8 h-28 animate-pulse rounded-2xl bg-gray-200" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <MachineCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
