export default function AdminSectionLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-black/10" />
      <div className="h-24 animate-pulse rounded-2xl border border-black/5 bg-white" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl border border-black/5 bg-white" />
      ))}
    </div>
  );
}
