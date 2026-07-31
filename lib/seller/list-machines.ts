import "server-only";

import { prisma } from "@/lib/db";
import type { SellerMachinesQueryInput } from "@/lib/validations/seller-machines";

function isMissingRelationTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const message =
    "message" in error ? String((error as { message?: string }).message) : "";
  return (
    code === "P2021" ||
    message.includes("Inquiry") ||
    message.includes("Favorite") ||
    message.includes("does not exist")
  );
}

export type SellerMachineListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  location: string | null;
  status: string;
  createdAt: Date;
  brand: { name: string };
  category: { name: string };
  images: { url: string }[];
  _count: { inquiries: number; favorites: number };
  rejectionReason?: string | null;
  rejectedAt?: Date | null;
  views: number;
};

/**
 * List machines owned by a seller using only stable Machine relations.
 * Inquiry/Favorite counts are loaded separately and soft-fail if those
 * tables have not been migrated yet.
 */
export async function listSellerMachines(
  sellerId: string,
  query: SellerMachinesQueryInput
): Promise<{
  items: SellerMachineListItem[];
  total: number;
  totalPages: number;
}> {
  if (!sellerId) {
    throw new Error("Seller id is required");
  }

  const where = {
    sellerId,
    ...(query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.category ? { categoryId: query.category } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { location: { contains: query.q, mode: "insensitive" as const } },
            { description: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy =
    query.sort === "oldest"
      ? ({ createdAt: "asc" } as const)
      : query.sort === "price_desc"
        ? ({ price: "desc" } as const)
        : query.sort === "price_asc"
          ? ({ price: "asc" } as const)
          : query.sort === "title_asc"
            ? ({ title: "asc" } as const)
            : query.sort === "title_desc"
              ? ({ title: "desc" } as const)
              : ({ createdAt: "desc" } as const);

  const [machines, total] = await Promise.all([
    prisma.machine.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.machine.count({ where }),
  ]);

  const countMap = new Map<string, { inquiries: number; favorites: number }>();
  const viewMap = new Map<string, number>();

  try {
    const counted = await prisma.machine.findMany({
      where: { sellerId },
      select: {
        id: true,
        _count: {
          select: {
            inquiries: true,
            favorites: true,
          },
        },
      },
    });

    for (const row of counted) {
      countMap.set(row.id, {
        inquiries: row._count.inquiries,
        favorites: row._count.favorites,
      });
    }
  } catch (error) {
    if (!isMissingRelationTableError(error)) {
      throw error;
    }
    console.warn(
      "[seller/machines] Inquiry/Favorite tables unavailable; interest counts default to 0. Run: npx prisma migrate deploy"
    );
  }

  try {
    const views = await prisma.recentlyViewed.groupBy({
      by: ["machineId"],
      where: { machineId: { in: machines.map((machine) => machine.id) } },
      _count: { machineId: true },
    });
    for (const row of views) {
      viewMap.set(row.machineId, row._count.machineId);
    }
  } catch (error) {
    if (!isMissingRelationTableError(error)) {
      throw error;
    }
    console.warn(
      "[seller/machines] RecentlyViewed table unavailable; view counts default to 0."
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  const items = machines.map((machine) => ({
    ...machine,
    _count: countMap.get(machine.id) ?? { inquiries: 0, favorites: 0 },
    views: viewMap.get(machine.id) ?? 0,
  }));

  return { items, total, totalPages };
}
