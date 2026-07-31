import type { SubscriptionPlan } from "@/app/generated/prisma/client";
import type { PlanSlug, SubscriptionEntitlements } from "./types";

export function planSlugFromName(slug: string): PlanSlug {
  if (slug === "basic" || slug === "premium" || slug === "enterprise") {
    return slug;
  }
  return "free";
}

export function entitlementsFromPlan(plan: SubscriptionPlan): SubscriptionEntitlements {
  return {
    slug: planSlugFromName(plan.slug),
    name: plan.name,
    maxListings: plan.maxListings,
    featuredListings: plan.featuredListings,
    homepageFeatured: plan.homepageFeatured,
    premiumBadge: plan.premiumBadge,
    analytics: plan.analytics,
    prioritySupport: plan.prioritySupport,
    dealerProfile: plan.dealerProfile,
    topSearchPriority: plan.topSearchPriority,
  };
}

export function isUnlimitedListings(maxListings: number | null) {
  return maxListings == null;
}
