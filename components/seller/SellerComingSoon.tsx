import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

type SellerComingSoonProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryHref?: string;
  primaryLabel?: string;
};

export function SellerComingSoon({
  title,
  description,
  icon: Icon = Construction,
  primaryHref = "/seller/dashboard",
  primaryLabel = "Back to Dashboard",
}: SellerComingSoonProps) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-[0_10px_30px_rgba(8,13,18,0.04)] sm:p-12">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-[#080D12] text-[#F5B800]">
        <Icon className="size-6" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold text-[#111827]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[#6B7280]">
        {description}
      </p>
      <Link
        href={primaryHref}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12]"
      >
        {primaryLabel}
      </Link>
    </div>
  );
}
