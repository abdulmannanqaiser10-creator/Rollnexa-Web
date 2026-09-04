import "server-only";

import { prisma } from "@/lib/db";

export async function getPremiumSellerIdSet(sellerIds: string[]) {
  if (sellerIds.length === 0) return new Set<string>();

  const now = new Date();
  const premiumSubs = await prisma.userSubscription.findMany({
    where: {
      userId: { in: sellerIds },
      status: "ACTIVE",
      plan: { premiumBadge: true },
      OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
    },
    select: { userId: true },
  });

  return new Set(premiumSubs.map((sub) => sub.userId));
}

export async function isPremiumSeller(userId: string) {
  const set = await getPremiumSellerIdSet([userId]);
  return set.has(userId);
}
