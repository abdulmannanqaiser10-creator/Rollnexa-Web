export default function BuyerMessagesLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-black/10" />
        <div className="h-8 w-40 animate-pulse rounded bg-black/10" />
      </div>
      <div className="h-[min(720px,calc(100dvh-10rem))] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
