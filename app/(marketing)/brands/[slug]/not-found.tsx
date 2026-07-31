import Link from "next/link";

export default function BrandNotFound() {
  return (
    <div className="bg-rn-surface py-14">
      <div className="rn-container">
        <div className="rn-card mx-auto max-w-lg p-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            404
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink">
            Brand not found
          </h1>
          <p className="mt-2 text-sm text-rn-muted">
            This brand does not exist or is no longer available.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/brands"
              className="inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              View Brands
            </Link>
            <Link
              href="/machines"
              className="inline-flex h-11 items-center rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold text-rn-ink"
            >
              Browse Machines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
