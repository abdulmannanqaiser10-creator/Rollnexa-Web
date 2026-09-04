import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import type { HomeMachine } from "@/lib/home/types";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
import { isPremiumSeller } from "@/lib/subscriptions/premium";

function isMissingTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

export type MachineDetailImage = {
  id: string;
  url: string;
  alt: string | null;
};

export type MachineDetailSeller = {
  id: string;
  name: string;
  companyName: string | null;
  city: string | null;
  country: string | null;
  avatar: string | null;
  listingCount: number;
  averageRating: number;
  totalReviews: number;
  isPremiumSeller: boolean;
  isDealerProfile: boolean;
};

export type MachineDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  model: string | null;
  price: number;
  priceLabel: string;
  year: number | null;
  hours: number | null;
  condition: string;
  conditionLabel: string;
  location: string | null;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string };
  images: MachineDetailImage[];
  seller: MachineDetailSeller;
  createdAt: string;
  isFavorited: boolean;
};

function formatCondition(condition: string) {
  return condition.charAt(0) + condition.slice(1).toLowerCase();
}

/** Seller listings prepend optional model as `Model: …\\n\\n…`. */
export function parseListingDescription(description: string | null) {
  if (!description?.trim()) {
    return { model: null as string | null, body: null as string | null };
  }

  const match = description.match(/^Model:\s*(.+?)(?:\n\n([\s\S]*))?$/);
  if (!match) {
    return { model: null, body: description.trim() };
  }

  const model = match[1]?.trim() || null;
  const body = match[2]?.trim() || null;
  return { model, body };
}

function mapRelatedMachine(machine: {
  id: string;
  title: string;
  slug: string;
  price: number;
  year: number | null;
  hours: number | null;
  condition: string;
  location: string | null;
  brand: { name: string } | null;
  category: { name: string } | null;
  images: { url: string }[];
}): HomeMachine {
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
    isPremium: machine.price >= 100000,
  };
}

export const getMachineBySlug = cache(async function getMachineBySlug(
  slug: string,
  userId?: string | null
): Promise<MachineDetail | null> {
  const trimmed = slug.trim();
  if (!trimmed || trimmed.length > 160) return null;

  const machine = await prisma.machine.findUnique({
    where: { slug: trimmed },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      price: true,
      year: true,
      hours: true,
      condition: true,
      location: true,
      status: true,
      createdAt: true,
      sellerId: true,
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, alt: true },
      },
      seller: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          profile: {
            select: {
              companyName: true,
              city: true,
              country: true,
              avatar: true,
              isDealerProfile: true,
            },
          },
          _count: {
            select: { machines: { where: { status: "PUBLISHED" } } },
          },
        },
      },
    },
  });

  if (!machine || machine.status !== "PUBLISHED") return null;
  const [sellerReviewAgg, sellerReviewCount, sellerIsPremium] = await Promise.all([
    prisma.review.aggregate({
      where: { sellerId: machine.sellerId, status: "PUBLISHED" },
      _avg: { rating: true },
    }),
    prisma.review.count({
      where: { sellerId: machine.sellerId, status: "PUBLISHED" },
    }),
    isPremiumSeller(machine.sellerId),
  ]);


  const { model, body } = parseListingDescription(machine.description);

  let isFavorited = false;
  if (userId) {
    try {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_machineId: { userId, machineId: machine.id },
        },
        select: { id: true },
      });
      isFavorited = favorite !== null;
    } catch (error) {
      // Only soft-fail when Favorite table has not been migrated yet.
      if (isMissingTableError(error)) {
        console.error(
          "[machines/detail] Favorite table is missing. Run: npx prisma migrate deploy"
        );
        isFavorited = false;
      } else {
        throw error;
      }
    }
  }

  return {
    id: machine.id,
    title: machine.title,
    slug: machine.slug,
    description: body,
    model,
    price: machine.price,
    priceLabel: formatPrice(machine.price),
    year: machine.year,
    hours: machine.hours,
    condition: machine.condition,
    conditionLabel: formatCondition(machine.condition),
    location: machine.location,
    category: machine.category,
    brand: machine.brand,
    images: machine.images.map((image) => ({
      ...image,
      url: resolveMachineImageUrl(image.url) ?? image.url,
    })),
    seller: {
      id: machine.seller.id,
      name: machine.seller.name || "Rollnexa Seller",
      companyName: machine.seller.profile?.companyName ?? null,
      city: machine.seller.profile?.city ?? null,
      country: machine.seller.profile?.country ?? null,
      avatar: machine.seller.profile?.avatar || machine.seller.image || null,
      listingCount: machine.seller._count.machines,
      averageRating: Number((sellerReviewAgg._avg.rating ?? 0).toFixed(1)),
      totalReviews: sellerReviewCount,
      isPremiumSeller: sellerIsPremium,
      isDealerProfile: machine.seller.profile?.isDealerProfile ?? false,
    },
    createdAt: machine.createdAt.toISOString(),
    isFavorited,
  };
});

export async function getRelatedMachines(params: {
  machineId: string;
  categoryId: string;
  brandId: string;
  take?: number;
}): Promise<HomeMachine[]> {
  const take = params.take ?? 4;

  const related = await prisma.machine.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: params.machineId },
      OR: [
        { categoryId: params.categoryId },
        { brandId: params.brandId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      year: true,
      hours: true,
      condition: true,
      location: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  return related.map(mapRelatedMachine);
}
