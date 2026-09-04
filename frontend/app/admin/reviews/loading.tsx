export default function AdminReviewsLoading() {
  return (
    <div className="rn-dashboard-bg min-h-screen">
      <main className="rn-container py-10 space-y-3">
        <div className="h-8 w-56 animate-pulse rounded bg-black/10" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-black/5 bg-white" />
        ))}
      </main>
    </div>
  );
}
