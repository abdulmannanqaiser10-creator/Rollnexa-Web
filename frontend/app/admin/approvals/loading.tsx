export default function AdminApprovalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-black/5" />
        <div className="h-8 w-56 rounded bg-black/5" />
        <div className="h-4 w-40 rounded bg-black/5" />
      </div>
      <div className="rn-panel h-28 rounded-2xl bg-black/5" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rn-panel h-36 rounded-2xl bg-black/5" />
        ))}
      </div>
    </div>
  );
}
