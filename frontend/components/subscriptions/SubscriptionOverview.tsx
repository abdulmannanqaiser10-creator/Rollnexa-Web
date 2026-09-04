import Link from "next/link";
import { CalendarDays, Crown, Package, Sparkles } from "lucide-react";
import type { SellerSubscriptionView } from "@/lib/subscriptions/types";
import { PremiumBadge } from "./PremiumBadge";

type SubscriptionOverviewProps = {
  subscription: SellerSubscriptionView;
};

export function SubscriptionOverview({ subscription }: SubscriptionOverviewProps) {
  const { plan, entitlements, listingCount, listingsRemaining, featuredRemaining } =
    subscription;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280] uppercase">
            Current Plan
          </p>
          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-[#111827]">{plan.name}</h2>
            {entitlements.premiumBadge ? <PremiumBadge /> : null}
          </div>
          <p className="mt-1 text-sm text-[#6B7280]">{plan.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/seller/subscription" className="inline-flex h-10 items-center rounded-xl bg-[#F5B800] px-4 text-sm font-bold text-[#080D12]">
            Upgrade Plan
          </Link>
          <Link href="/seller/payments" className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#111827]">
            Payment History
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[#F9FAFB] p-4">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Package className="size-4" />
            <span className="text-xs font-semibold uppercase">Listings Used</span>
          </div>
          <p className="mt-2 text-lg font-bold text-[#111827]">
            {listingCount}
            {listingsRemaining != null ? ` / ${listingCount + listingsRemaining}` : " / Unlimited"}
          </p>
        </div>
        <div className="rounded-xl bg-[#F9FAFB] p-4">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold uppercase">Featured Left</span>
          </div>
          <p className="mt-2 text-lg font-bold text-[#111827]">{featuredRemaining}</p>
        </div>
        <div className="rounded-xl bg-[#F9FAFB] p-4">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <CalendarDays className="size-4" />
            <span className="text-xs font-semibold uppercase">Expiry</span>
          </div>
          <p className="mt-2 text-lg font-bold text-[#111827]">
            {subscription.subscription?.expiryDate
              ? new Date(subscription.subscription.expiryDate).toLocaleDateString()
              : "No expiry"}
          </p>
        </div>
        <div className="rounded-xl bg-[#F9FAFB] p-4">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Crown className="size-4" />
            <span className="text-xs font-semibold uppercase">Status</span>
          </div>
          <p className="mt-2 text-lg font-bold text-[#111827]">{subscription.status}</p>
        </div>
      </div>
    </section>
  );
}
