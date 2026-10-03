import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";

const packages = [
  { name: "Boost", slug: "boost", description: "Higher position in relevant search results", price: 500, currency: "PKR", durationDays: 3, priority: 1, placementType: "SEARCH", badgeType: "NONE", displayOrder: 1 },
  { name: "Featured", slug: "featured", description: "Featured badge and better category placement", price: 1000, currency: "PKR", durationDays: 7, priority: 2, placementType: "SEARCH_CATEGORY", badgeType: "FEATURED", displayOrder: 2 },
  { name: "Premium", slug: "premium", description: "Premium placement and sponsored badge", price: 2500, currency: "PKR", durationDays: 14, priority: 3, placementType: "SEARCH_CATEGORY_HOME", badgeType: "PREMIUM", displayOrder: 3 },
];
async function main() {
  const { prisma } = createScriptPrisma();
  try {
    for (const data of packages) if (!await prisma.promotionPackage.findUnique({ where: { slug: data.slug }, select: { id: true } })) await prisma.promotionPackage.create({ data: { ...data, isActive: true } });
    console.log("Promotion packages ensured.");
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error("Failed to seed promotion packages", error); process.exit(1); });
