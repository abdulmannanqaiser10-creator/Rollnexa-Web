export default function NotificationsLoading() {
  return (
    <div className="space-y-4 py-6 sm:py-8">
      <div className="h-4 w-28 animate-pulse rounded bg-black/5" />
      <div className="h-8 w-64 animate-pulse rounded bg-black/5" />
      <div className="rn-panel h-20 animate-pulse bg-black/5" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rn-panel h-20 animate-pulse bg-black/5" />
        ))}
      </div>
    </div>
  );
}
