import { prisma } from "@/lib/db";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
import { cache } from "react";
import type { Prisma } from "@prisma/generated";
import {
  type MachineBrowseFilters,
  type MachineSort,
} from "@/lib/validations/machine-filters";
import type { HomeMachine } from "@/lib/home-data";
import { getPremiumSellerIdSet } from "@/lib/subscriptions/premium";

export type BrowsePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type BrowseMachinesResult = {
  machines: HomeMachine[];
  pagination: BrowsePagination;
  filters: MachineBrowseFilters;
};

function buildOrderBy(
  sort: MachineSort
): Prisma.MachineOrderByWithRelationInput[] {
  const featuredFirst = { isFeatured: "desc" as const };
  switch (sort) {
    case "oldest":
      return [featuredFirst, { createdAt: "asc" }];
    case "price-asc":
      return [featuredFirst, { price: "asc" }];
    case "price-desc":
      return [featuredFirst, { price: "desc" }];
    case "year-newest":
      return [featuredFirst, { year: "desc" }];
    case "year-oldest":
      return [featuredFirst, { year: "asc" }];
    case "newest":
    default:
      return [featuredFirst, { createdAt: "desc" }];
  }
}

export function buildMachineWhere(
  filters: MachineBrowseFilters
): Prisma.MachineWhereInput {
  const where: Prisma.MachineWhereInput = {
    status: "PUBLISHED",
  };

  const search = filters.search.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { brand: { name: { contains: search, mode: "insensitive" } } },
      { category: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.brand) {
    where.brand = { slug: filters.brand };
  }

  if (filters.location.trim()) {
    where.location = {
      contains: filters.location.trim(),
      mode: "insensitive",
    };
  }

  if (filters.condition) {
    where.condition = filters.condition;
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  if (filters.minYear != null || filters.maxYear != null) {
    where.year = {
      ...(filters.minYear != null ? { gte: filters.minYear } : {}),
      ...(filters.maxYear != null ? { lte: filters.maxYear } : {}),
    };
  }

  return where;
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

export async function browseMachines(
  filters: MachineBrowseFilters
): Promise<BrowseMachinesResult> {
  const where = buildMachineWhere(filters);
  const orderBy = buildOrderBy(filters.sort);
  const pageHint = Math.max(1, filters.page);
  const skipHint = (pageHint - 1) * filters.limit;

  const [total, rows] = await Promise.all([
    prisma.machine.count({ where }),
    prisma.machine.findMany({
      where,
      orderBy,
      skip: skipHint,
      take: filters.limit,
      select: {
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
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const page = Math.min(pageHint, totalPages);

  // If the requested page was beyond totalPages, refetch the last page.
  const finalRows =
    page === pageHint
      ? rows
      : await prisma.machine.findMany({
          where,
          orderBy,
          skip: (page - 1) * filters.limit,
          take: filters.limit,
          select: {
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
            brand: { select: { name: true } },
            category: { select: { name: true } },
            images: {
              orderBy: { sortOrder: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        });

  const premiumSellerIds = await getPremiumSellerIdSet(
    finalRows.map((row) => row.sellerId)
  );

  return {
    machines: finalRows.map((row) => mapMachine(row, premiumSellerIds)),
    pagination: {
      page,
      limit: filters.limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    filters: {
      ...filters,
      page,
    },
  };
}

export const getBrowseFilterOptions = cache(async function getBrowseFilterOptions() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return { categories, brands };
});

