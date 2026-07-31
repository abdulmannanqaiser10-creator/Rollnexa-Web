export default function SellerReviewsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-52 animate-pulse rounded bg-black/10" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl border border-black/5 bg-white" />
      ))}
    </div>
  );
}
