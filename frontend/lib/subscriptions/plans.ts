import "server-only";

import { prisma } from "@/lib/db";
import type { PrismaClient } from "@prisma/generated";

export const DEFAULT_PLAN_SLUG = "free";

const DEFAULT_PLANS = [
    {
      name: "Free",
      slug: "free",
      description: "Get started with essential marketplace tools.",
      price: 0,
      durationDays: 36500,
      currency: "PKR",
      maxListings: 1,
      featuredListings: 0,
      promotionCredits: 0,
      homepageFeatured: false,
      premiumBadge: false,
      analytics: false,
      prioritySupport: false,
      dealerProfile: false,
      topSearchPriority: false,
      sortOrder: 0,
    },
    {
      name: "Basic",
      slug: "basic",
      description: "Grow your inventory with featured visibility.",
      price: 1499,
      currency: "PKR",
      durationDays: 30,
      maxListings: 5,
      featuredListings: 0,
      promotionCredits: 0,
      homepageFeatured: false,
      premiumBadge: false,
      analytics: false,
      prioritySupport: true,
      dealerProfile: false,
      topSearchPriority: false,
      sortOrder: 1,
    },
    {
      name: "Pro",
      slug: "premium",
      description: "Unlock homepage placement and premium seller tools.",
      price: 2999,
      currency: "PKR",
      durationDays: 30,
      maxListings: 20,
      featuredListings: 1,
      promotionCredits: 1,
      homepageFeatured: false,
      premiumBadge: false,
      analytics: true,
      prioritySupport: true,
      dealerProfile: false,
      topSearchPriority: true,
      sortOrder: 2,
    },
    {
      name: "Business",
      slug: "enterprise",
      description: "Full dealer profile and unlimited premium placement.",
      price: 5999,
      currency: "PKR",
      durationDays: 30,
      maxListings: 100,
      featuredListings: 3,
      promotionCredits: 3,
      homepageFeatured: true,
      premiumBadge: true,
      analytics: true,
      prioritySupport: true,
      dealerProfile: true,
      topSearchPriority: true,
      sortOrder: 3,
    },
  ] as const;

export async function ensureDefaultPlans(client: PrismaClient = prisma) {
  for (const plan of DEFAULT_PLANS) {
    const existing = await client.subscriptionPlan.findUnique({ where: { slug: plan.slug }, select: { id: true } });
    if (!existing) await client.subscriptionPlan.create({ data: { ...plan, isActive: true } });
  }
}

export async function getActivePlans() {
  await ensureDefaultPlans();
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPlanBySlug(slug: string) {
  await ensureDefaultPlans();
  return prisma.subscriptionPlan.findFirst({
    where: { slug, isActive: true },
  });
}

export async function getFreePlan() {
  await ensureDefaultPlans();
  const plan = await getPlanBySlug(DEFAULT_PLAN_SLUG);
  if (!plan) throw new Error("Free plan is not configured");
  return plan;
}
