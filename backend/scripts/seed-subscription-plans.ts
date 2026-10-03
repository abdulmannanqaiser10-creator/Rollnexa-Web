import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";

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

async function main() {
  const { prisma } = createScriptPrisma();
  try {
    for (const plan of DEFAULT_PLANS) {
      const existing = await prisma.subscriptionPlan.findUnique({ where: { slug: plan.slug }, select: { id: true } });
      if (!existing) {
        await prisma.subscriptionPlan.create({ data: { ...plan, isActive: true } });
      } else {
        const legacy = await prisma.subscriptionPlan.findUnique({ where: { slug: plan.slug }, select: { price: true, currency: true, maxListings: true } });
        const oldDefaults: Record<string, { price: number; listings: number | null }> = {
          basic: { price: 49, listings: 25 }, premium: { price: 99, listings: null }, enterprise: { price: 199, listings: null }, free: { price: 0, listings: 5 },
        };
        const previous = oldDefaults[plan.slug];
        if (legacy && previous && legacy.price === previous.price && legacy.currency === "USD" && legacy.maxListings === previous.listings) {
          await prisma.subscriptionPlan.update({ where: { slug: plan.slug }, data: { name: plan.name, price: plan.price, currency: plan.currency, maxListings: plan.maxListings, featuredListings: plan.featuredListings, promotionCredits: plan.promotionCredits } });
        }
      }
    }
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, price: true, isActive: true },
    });
    console.log("Subscription plans seeded:");
    console.log(JSON.stringify(plans, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed subscription plans:", error);
  process.exit(1);
});
