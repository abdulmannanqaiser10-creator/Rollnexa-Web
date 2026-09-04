export default function SellerSettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-14 animate-pulse rounded-2xl bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
