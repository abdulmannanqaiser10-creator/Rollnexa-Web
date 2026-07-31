import "server-only";

import { prisma } from "@/lib/db";
import type { PrismaClient } from "@/app/generated/prisma/client";

export const DEFAULT_PLAN_SLUG = "free";

const DEFAULT_PLANS = [
    {
      name: "Free",
      slug: "free",
      description: "Get started with essential marketplace tools.",
      price: 0,
      durationDays: 36500,
      maxListings: 5,
      featuredListings: 0,
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
      price: 49,
      durationDays: 30,
      maxListings: 25,
      featuredListings: 3,
      homepageFeatured: false,
      premiumBadge: false,
      analytics: false,
      prioritySupport: true,
      dealerProfile: false,
      topSearchPriority: false,
      sortOrder: 1,
    },
    {
      name: "Premium",
      slug: "premium",
      description: "Unlock homepage placement and premium seller tools.",
      price: 99,
      durationDays: 30,
      maxListings: null,
      featuredListings: 10,
      homepageFeatured: true,
      premiumBadge: true,
      analytics: true,
      prioritySupport: true,
      dealerProfile: false,
      topSearchPriority: true,
      sortOrder: 2,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Full dealer profile and unlimited premium placement.",
      price: 199,
      durationDays: 30,
      maxListings: null,
      featuredListings: 999,
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
    await client.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        maxListings: plan.maxListings,
        featuredListings: plan.featuredListings,
        homepageFeatured: plan.homepageFeatured,
        premiumBadge: plan.premiumBadge,
        analytics: plan.analytics,
        prioritySupport: plan.prioritySupport,
        dealerProfile: plan.dealerProfile,
        topSearchPriority: plan.topSearchPriority,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      create: { ...plan, isActive: true },
    });
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
