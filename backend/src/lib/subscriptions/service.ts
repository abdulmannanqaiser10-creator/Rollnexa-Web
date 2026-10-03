import "server-only";

import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/service";
import { sendSubscriptionReminderEmail } from "@/lib/emails/service";
import {
  entitlementsFromPlan,
  isUnlimitedListings,
} from "@/lib/subscriptions/entitlements";
import { getFreePlan } from "@/lib/subscriptions/plans";
import type { SellerSubscriptionView } from "@/lib/subscriptions/types";

export async function expireDueSubscriptions() {
  const now = new Date();
  const expired = await prisma.userSubscription.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: { lt: now },
    },
    include: { plan: true, user: { select: { id: true } } },
  });

  const freePlan = await getFreePlan();

  for (const sub of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.userSubscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      });

      if (sub.plan.dealerProfile) {
        await tx.profile.updateMany({
          where: { userId: sub.userId },
          data: { isDealerProfile: false },
        });
      }

      await tx.userSubscription.create({
        data: {
          userId: sub.userId,
          planId: freePlan.id,
          status: "ACTIVE",
          startDate: now,
          expiryDate: null,
          remainingListings: freePlan.maxListings,
        },
      });
    });

    await createNotification({
      userId: sub.userId,
      type: "SUBSCRIPTION_EXPIRED",
      title: "Subscription expired",
      message: `Your ${sub.plan.name} plan has expired. You have been moved to the Free plan.`,
      relatedEntityId: sub.id,
      relatedEntityType: "SUBSCRIPTION",
    });
  }

  return expired.length;
}

async function maybeSendSubscriptionReminder(input: {
  userId: string;
  expiryDate: Date | null;
  planName: string;
}) {
  if (!input.expiryDate) return;

  const now = new Date();
  const reminderWindow = new Date(now);
  reminderWindow.setDate(reminderWindow.getDate() + 7);

  if (input.expiryDate > now && input.expiryDate <= reminderWindow) {
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000";
    void sendSubscriptionReminderEmail({
      sellerId: input.userId,
      planName: input.planName,
      expiryDate: input.expiryDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      renewUrl: `${baseUrl}/seller/subscription`,
    }).catch((error) => console.error("[subscriptions] reminder email failed", error));
  }
}

export async function getSellerSubscriptionView(
  userId: string
): Promise<SellerSubscriptionView> {
  await expireDueSubscriptions();

  const [freePlan, activeSub, listingCount, featuredCount, user] = await Promise.all([
    getFreePlan(),
    prisma.userSubscription.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.machine.count({ where: { sellerId: userId, status: { in: ["DRAFT", "PENDING_REVIEW", "PUBLISHED"] } } }),
    prisma.machine.count({
      where: { sellerId: userId, isFeatured: true, status: "PUBLISHED" },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { freeListingsUsed: true, accountStatus: true } }),
  ]);

  if (activeSub?.plan && activeSub.status === "ACTIVE") {
    await maybeSendSubscriptionReminder({
      userId,
      expiryDate: activeSub.expiryDate,
      planName: activeSub.plan.name,
    });
  }

  const plan = activeSub?.plan ?? freePlan;
  const entitlements = entitlementsFromPlan(plan);
  const isActive = activeSub?.status === "ACTIVE" || plan.slug === "free";
  const listingsRemaining =
    entitlements.maxListings == null
      ? null
      : Math.max(0, entitlements.maxListings - listingCount);
  const featuredRemaining = Math.max(
    0,
    entitlements.featuredListings - featuredCount
  );

  const freeLimit = freePlan.maxListings ?? 1;
  const historicListings = await prisma.machine.count({ where: { sellerId: userId } });
  const freeListingsRemaining = Math.max(0, freeLimit - Math.max(user?.freeListingsUsed ?? 0, historicListings));
  const accountDisabled = user?.accountStatus !== "ACTIVE";
  const planInactive = Boolean(activeSub && !activeSub.plan.isActive);
  const canCreateListing = !accountDisabled && !planInactive && (
    isUnlimitedListings(entitlements.maxListings) || listingCount < entitlements.maxListings
  );
  const reason = accountDisabled ? "SELLER_DISABLED" as const
    : planInactive ? "PLAN_INACTIVE" as const
    : canCreateListing ? (plan.slug === "free" && freeListingsRemaining > 0 ? "FREE_LISTING_AVAILABLE" as const : "ALLOWED" as const)
    : activeSub?.expiryDate && activeSub.expiryDate < new Date() ? "SUBSCRIPTION_EXPIRED" as const
    : activeSub ? "LISTING_LIMIT_REACHED" as const : "NO_SUBSCRIPTION" as const;

  return {
    subscription: activeSub,
    plan,
    status: activeSub?.status ?? "FREE",
    isActive,
    entitlements,
    listingCount,
    featuredCount,
    canCreateListing: canCreateListing && (plan.slug !== "free" || freeListingsRemaining > 0),
    listingsRemaining,
    featuredRemaining,
    reason: plan.slug === "free" && freeListingsRemaining <= 0 ? "LISTING_LIMIT_REACHED" : reason,
    freeListingsRemaining,
    requiresSubscription: plan.slug === "free" && freeListingsRemaining <= 0,
  };
}

export async function checkListingEntitlement(userId: string) {
  const view = await getSellerSubscriptionView(userId);
  return {
    canCreateListing: view.canCreateListing,
    reason: view.reason,
    currentListings: view.listingCount,
    listingLimit: view.entitlements.maxListings,
    remainingListings: view.listingsRemaining,
    freeListingsRemaining: view.freeListingsRemaining,
    subscriptionStatus: view.status,
    plan: view.plan,
    requiresSubscription: view.requiresSubscription,
  };
}

export async function sellerHasPremiumBadge(userId: string) {
  const view = await getSellerSubscriptionView(userId);
  return view.isActive && view.entitlements.premiumBadge;
}

export async function canSellerCreateListing(userId: string) {
  const view = await getSellerSubscriptionView(userId);
  return view.canCreateListing;
}

export async function canSellerFeatureListing(userId: string) {
  const view = await getSellerSubscriptionView(userId);
  return view.isActive && view.featuredRemaining > 0;
}

export async function activateSubscriptionFromPayment(input: {
  userId: string;
  planId: string;
  paymentId: string;
  renew?: boolean;
}) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) throw new Error("Plan not found");

  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + plan.durationDays);

  const existingActive = await prisma.userSubscription.findFirst({
    where: { userId: input.userId, status: "ACTIVE" },
    include: { plan: true },
  });

  let subscriptionId: string;

  await prisma.$transaction(async (tx) => {
    if (existingActive && !input.renew) {
      await tx.userSubscription.update({
        where: { id: existingActive.id },
        data: { status: "EXPIRED" },
      });
    }

    const startDate =
      input.renew && existingActive?.expiryDate && existingActive.expiryDate > now
        ? existingActive.expiryDate
        : now;
    const renewedExpiry = new Date(startDate);
    renewedExpiry.setDate(renewedExpiry.getDate() + plan.durationDays);

    const subscription = await tx.userSubscription.create({
      data: {
        userId: input.userId,
        planId: plan.id,
        status: "ACTIVE",
        startDate,
        expiryDate: plan.slug === "free" ? null : renewedExpiry,
        remainingListings: plan.maxListings,
        autoRenew: false,
      },
    });

    subscriptionId = subscription.id;

    await tx.payment.update({
      where: { id: input.paymentId },
      data: { subscriptionId: subscription.id },
    });

    if (plan.dealerProfile) {
      await tx.profile.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId, isDealerProfile: true },
        update: { isDealerProfile: true },
      });
    }
  });

  const notificationType = input.renew
    ? "SUBSCRIPTION_RENEWED"
    : "SUBSCRIPTION_ACTIVATED";

  await createNotification({
    userId: input.userId,
    type: notificationType,
    title: input.renew ? "Subscription renewed" : "Subscription activated",
    message: `Your ${plan.name} plan is now active.`,
    relatedEntityId: subscriptionId!,
    relatedEntityType: "SUBSCRIPTION",
  });

  return subscriptionId!;
}

export async function assignFreePlanToSeller(userId: string) {
  const freePlan = await getFreePlan();
  const existing = await prisma.userSubscription.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (existing) return existing;

  return prisma.userSubscription.create({
    data: {
      userId,
      planId: freePlan.id,
      status: "ACTIVE",
      startDate: new Date(),
      expiryDate: null,
      remainingListings: freePlan.maxListings,
    },
  });
}
