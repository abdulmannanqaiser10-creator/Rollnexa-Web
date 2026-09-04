import Link from "next/link";
import { Sparkles } from "lucide-react";

export function PremiumSellerCTA() {
  return (
    <section className="overflow-hidden rounded-2xl bg-[#080D12] p-5 text-white sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5B800]/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#F5B800] uppercase">
            <Sparkles className="size-3.5" />
            Premium
          </span>
          <h3 className="mt-3 font-display text-xl font-bold sm:text-2xl">
            Get More Visibility for Your Machines
          </h3>
          <p className="mt-2 text-sm text-white/65">
            Upgrade your listings and reach more serious buyers across the
            Rollnexa marketplace.
          </p>
        </div>
        <Link
          href="/seller/subscription"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12] transition hover:bg-[#FFB800]"
        >
          Explore Premium Listings
        </Link>
      </div>
    </section>
  );
}
