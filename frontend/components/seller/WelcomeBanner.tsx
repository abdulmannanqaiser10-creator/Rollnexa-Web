import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

type WelcomeBannerProps = {
  sellerName: string;
};

export function WelcomeBanner({ sellerName }: WelcomeBannerProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(8,13,18,0.05)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#F5B800] uppercase">
            Seller Workspace
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#111827] sm:text-3xl">
            Welcome back, {sellerName}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280] sm:text-base">
            Manage your machines, track inquiries, and grow your business with
            Rollnexa.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/seller/machines/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12] transition hover:bg-[#FFB800]"
          >
            <Plus className="size-4" />
            Add New Machine
          </Link>
          <Link
            href="/machines"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold text-[#111827] transition hover:border-[#F5B800]"
          >
            View Marketplace
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
