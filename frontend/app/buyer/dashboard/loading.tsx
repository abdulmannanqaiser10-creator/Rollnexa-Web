export default function BuyerDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="h-44 animate-pulse rounded-2xl bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-white" />
      <div className="h-52 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
