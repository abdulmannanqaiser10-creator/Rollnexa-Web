import type {
  PaymentMethod,
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
} from "@prisma/generated";

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
  reason: "ALLOWED" | "FREE_LISTING_AVAILABLE" | "NO_SUBSCRIPTION" | "SUBSCRIPTION_EXPIRED" | "LISTING_LIMIT_REACHED" | "PLAN_INACTIVE" | "SELLER_DISABLED";
  freeListingsRemaining: number;
  requiresSubscription: boolean;
};

export type CheckoutInput = {
  userId: string;
  planSlug: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  renew?: boolean;
};
