import Link from "next/link";

export default function MachineNotFound() {
  return (
    <div className="bg-rn-surface py-16">
      <div className="rn-container">
        <div className="rn-card mx-auto max-w-lg p-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            404
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink">
            Machine Not Found
          </h1>
          <p className="mt-3 text-sm text-rn-muted">
            This listing may have been removed, sold, or is no longer published.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/machines"
              className="inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Browse Machines
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-lg border border-rn-ink/10 px-5 text-sm font-semibold text-rn-ink"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
