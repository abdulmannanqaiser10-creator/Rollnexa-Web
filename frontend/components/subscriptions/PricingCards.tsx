"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type PricingPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  maxListings: number | null;
  featuredListings: number;
  homepageFeatured: boolean;
  premiumBadge: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  dealerProfile: boolean;
  topSearchPriority: boolean;
};

type PricingCardsProps = {
  plans: PricingPlan[];
  currentPlanSlug?: string;
};

function formatListings(max: number | null) {
  return max == null ? "Unlimited listings" : `${max} machine listings`;
}

export function PricingCards({ plans, currentPlanSlug }: PricingCardsProps) {
  const router = useRouter();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(planSlug: string) {
    if (planSlug === "free" || planSlug === currentPlanSlug) return;
    setLoadingSlug(planSlug);
    setError(null);

    try {
      const res = await fetch("/api/seller/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Unable to start checkout");
        return;
      }
      const url = data?.checkout?.checkoutUrl;
      if (typeof url === "string") {
        if (/^https:\/\//i.test(url)) window.location.assign(url);
        else router.push(url);
      }
    } catch {
      setError("Unable to start checkout");
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug;
          const highlighted = plan.slug === "premium";

          return (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
                highlighted ? "border-[#F5B800] ring-1 ring-[#F5B800]/30" : "border-black/10"
              )}
            >
              <div className="mb-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280] uppercase">
                  {plan.name}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="font-display text-3xl font-bold text-[#111827]">
                    {plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}
                  </span>
                  {plan.price > 0 ? (
                    <span className="pb-1 text-sm text-[#6B7280]">/month</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-[#6B7280]">{plan.description}</p>
              </div>

              <ul className="mb-6 space-y-2 text-sm text-[#374151]">
                <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-[#F5B800]" />{formatListings(plan.maxListings)}</li>
                {plan.featuredListings > 0 ? <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-[#F5B800]" />{plan.featuredListings >= 999 ? "Unlimited featured listings" : `${plan.featuredListings} featured listings`}</li> : null}
                {plan.homepageFeatured ? <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-[#F5B800]" />Homepage featured placement</li> : null}
                {plan.premiumBadge ? <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-[#F5B800]" />Premium seller badge</li> : null}
                {plan.analytics ? <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-[#F5B800]" />Advanced analytics</li> : null}
                {plan.prioritySupport ? <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-[#F5B800]" />Priority support</li> : null}
                {plan.dealerProfile ? <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-[#F5B800]" />Dealer profile</li> : null}
              </ul>

              {plan.slug === "free" ? (
                <span className="mt-auto inline-flex h-11 items-center justify-center rounded-xl border border-black/10 text-sm font-semibold text-[#6B7280]">
                  {isCurrent ? "Current Plan" : "Included"}
                </span>
              ) : isCurrent ? (
                <Link
                  href="/seller/payments"
                  className="mt-auto inline-flex h-11 items-center justify-center rounded-xl border border-[#F5B800] text-sm font-semibold text-[#111827]"
                >
                  Manage Plan
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={loadingSlug === plan.slug}
                  onClick={() => startCheckout(plan.slug)}
                  className="mt-auto inline-flex h-11 items-center justify-center rounded-xl bg-[#F5B800] text-sm font-bold text-[#080D12] disabled:opacity-60"
                >
                  {loadingSlug === plan.slug ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Upgrade"
                  )}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
