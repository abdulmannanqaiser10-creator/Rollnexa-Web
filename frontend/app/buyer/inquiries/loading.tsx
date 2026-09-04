export default function BuyerInquiriesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-black/10" />
        <div className="h-8 w-52 animate-pulse rounded bg-black/10" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />
      ))}
    </div>
  );
}
