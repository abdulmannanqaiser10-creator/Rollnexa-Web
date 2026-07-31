import "server-only";

import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/service";
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

export async function getSellerSubscriptionView(
  userId: string
): Promise<SellerSubscriptionView> {
  await expireDueSubscriptions();

  const [freePlan, activeSub, listingCount, featuredCount] = await Promise.all([
    getFreePlan(),
    prisma.userSubscription.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.machine.count({
      where: {
        sellerId: userId,
        status: { notIn: ["ARCHIVED"] },
      },
    }),
    prisma.machine.count({
      where: { sellerId: userId, isFeatured: true, status: "PUBLISHED" },
    }),
  ]);

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

  return {
    subscription: activeSub,
    plan,
    status: activeSub?.status ?? "FREE",
    isActive,
    entitlements,
    listingCount,
    featuredCount,
    canCreateListing:
      isUnlimitedListings(entitlements.maxListings) ||
      listingCount < entitlements.maxListings,
    listingsRemaining,
    featuredRemaining,
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
