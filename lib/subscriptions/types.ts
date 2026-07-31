import type {
  PaymentMethod,
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
} from "@/app/generated/prisma/client";

export type PlanSlug = "free" | "basic" | "premium" | "enterprise";

export type SubscriptionEntitlements = {
  slug: PlanSlug;
  name: string;
  maxListings: number | null;
  featuredListings: number;
  homepageFeatured: boolean;
  premiumBadge: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  dealerProfile: boolean;
  topSearchPriority: boolean;
};

export type SellerSubscriptionView = {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus | "FREE";
  isActive: boolean;
  entitlements: SubscriptionEntitlements;
  listingCount: number;
  featuredCount: number;
  canCreateListing: boolean;
  listingsRemaining: number | null;
  featuredRemaining: number;
};

export type CheckoutInput = {
  userId: string;
  planSlug: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  renew?: boolean;
};
