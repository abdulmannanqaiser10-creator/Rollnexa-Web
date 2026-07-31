import "server-only";

import { prisma } from "@/lib/db";
import { getPremiumSellerIdSet } from "@/lib/subscriptions/premium";
import type {
  HomeCategory,
  HomeDealer,
  HomeMachine,
  HomeStats,
} from "@/lib/home/types";

export type {
  HomeCategory,
  HomeDealer,
  HomeMachine,
  HomeStats,
} from "@/lib/home/types";
export { HERO_IMAGE } from "@/lib/home/types";
export { formatCount, formatPrice } from "@/lib/format";

const categoryImageMap: Record<string, string> = {
  "road-roller":
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
  excavator:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  bulldozer:
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80",
  crane:
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
  loader:
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
  "motor-grader":
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
  "asphalt-paver":
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  "dump-truck":
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80",
};

export function getCategoryImage(slug: string) {
  return (
    categoryImageMap[slug] ||
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80"
  );
}

function mapMachine(
  machine: {
  id: string;
  title: string;
  slug: string;
  price: number;
  year: number | null;
  hours: number | null;
  condition: string;
  location: string | null;
  sellerId: string;
  isFeatured: boolean;
  createdAt: Date;
  brand: { name: string } | null;
  category: { name: string } | null;
  images: { url: string }[];
},
  premiumSellerIds: Set<string>
): HomeMachine {
  return {
    id: machine.id,
    title: machine.title,
    slug: machine.slug,
    price: machine.price,
    year: machine.year,
    hours: machine.hours,
    condition: machine.condition,
    location: machine.location,
    imageUrl: machine.images[0]?.url ?? null,
    brandName: machine.brand?.name ?? null,
    categoryName: machine.category?.name ?? null,
    isPremium: premiumSellerIds.has(machine.sellerId) || machine.isFeatured,
  };
}

export async function getHomePageData() {
  const [
    categories,
    brands,
    featuredRows,
    recentMachines,
    dealers,
    machineCount,
    dealerCount,
    buyerCount,
    cityGroups,
    soldCount,
  ] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { machines: { where: { status: "PUBLISHED" } } },
        },
      },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.machine.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: [{ createdAt: "desc" }],
      take: 8,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.machine.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.user.findMany({
      where: { role: "SELLER" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        profile: true,
        _count: {
          select: { machines: { where: { status: "PUBLISHED" } } },
        },
      },
    }),
    prisma.machine.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.machine.groupBy({
      by: ["location"],
      where: { status: "PUBLISHED", location: { not: null } },
    }),
    prisma.machine.count({ where: { status: "SOLD" } }),
  ]);

  const homeCategories: HomeCategory[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    machineCount: category._count.machines,
  }));

  const homeDealers: HomeDealer[] = dealers.map((dealer, index) => ({
    id: dealer.id,
    name: dealer.profile?.companyName || dealer.name || "Rollnexa Dealer",
    image: dealer.image || dealer.profile?.avatar || null,
    companyName: dealer.profile?.companyName || null,
    city: dealer.profile?.city || null,
    country: dealer.profile?.country || null,
    listingCount: dealer._count.machines,
    verified: true,
    rating: 4.6 + ((index % 4) * 0.1),
  }));

  const stats: HomeStats = {
    machines: machineCount,
    dealers: dealerCount,
    buyers: buyerCount,
    cities: cityGroups.filter((group) => group.location).length,
    deals: soldCount,
  };

  const featuredMachines =
    featuredRows.length > 0
      ? featuredRows
      : await prisma.machine.findMany({
          where: { status: "PUBLISHED" },
          orderBy: [{ price: "desc" }, { createdAt: "desc" }],
          take: 8,
          include: {
            brand: true,
            category: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
        });

  const premiumSellerIds = await getPremiumSellerIdSet(
    [...featuredMachines, ...recentMachines].map((machine) => machine.sellerId)
  );

  return {
    categories: homeCategories,
    brands: brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    })),
    featuredMachines: featuredMachines.map((machine) =>
      mapMachine(machine, premiumSellerIds)
    ),
    recentMachines: recentMachines.map((machine) =>
      mapMachine(machine, premiumSellerIds)
    ),
    dealers: homeDealers,
    stats,
  };
}

