import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
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
    imageUrl: resolveMachineImageUrl(machine.images[0]?.url),
    brandName: machine.brand?.name ?? null,
    categoryName: machine.category?.name ?? null,
    isPremium: premiumSellerIds.has(machine.sellerId) || machine.isFeatured,
  };
}

const machineCardSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  year: true,
  hours: true,
  condition: true,
  location: true,
  sellerId: true,
  isFeatured: true,
  createdAt: true,
  brand: { select: { name: true } },
  category: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
} as const;

async function loadHomePageData() {
  const [categories, brands, featuredRows, recentMachines] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: { machines: { where: { status: "PUBLISHED" } } },
        },
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.machine.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: [{ createdAt: "desc" }],
      take: 8,
      select: machineCardSelect,
    }),
    prisma.machine.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: machineCardSelect,
    }),
  ]);

  const homeCategories: HomeCategory[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    machineCount: category._count.machines,
  }));

  const featuredMachines =
    featuredRows.length > 0
      ? featuredRows
      : await prisma.machine.findMany({
          where: { status: "PUBLISHED" },
          orderBy: [{ price: "desc" }, { createdAt: "desc" }],
          take: 8,
          select: machineCardSelect,
        });

  const premiumSellerIds = await getPremiumSellerIdSet(
    [...featuredMachines, ...recentMachines].map((machine) => machine.sellerId)
  );

  const emptyDealers: HomeDealer[] = [];
  const emptyStats: HomeStats = {
    machines: 0,
    dealers: 0,
    buyers: 0,
    cities: 0,
    deals: 0,
  };

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
    dealers: emptyDealers,
    stats: emptyStats,
  };
}

export const getHomePageData = unstable_cache(loadHomePageData, ["home-page-data"], {
  revalidate: 60,
  tags: ["home", "machines", "catalog"],
});
