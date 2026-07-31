import "server-only";

import { prisma } from "@/lib/db";
import type { RecentlyViewedMachine } from "@/lib/recently-viewed/types";

export type { RecentlyViewedMachine } from "@/lib/recently-viewed/types";
export { formatRelativeViewedAt } from "@/lib/format";

export const RECENTLY_VIEWED_LIMIT = 20;

function logRecentlyViewedError(scope: string, error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code)
      : undefined;
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message)
      : String(error);

  console.error(`[recently-viewed] ${scope} failed`, {
    code,
    message: message.slice(0, 300),
  });
}

export async function trackRecentlyViewed(userId: string, machineId: string) {
  const machine = await prisma.machine.findFirst({
    where: { id: machineId, status: "PUBLISHED" },
    select: { id: true },
  });

  if (!machine) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const viewedAt = new Date();

  await prisma.recentlyViewed.upsert({
    where: {
      userId_machineId: { userId, machineId: machine.id },
    },
    create: {
      userId,
      machineId: machine.id,
      viewedAt,
    },
    update: {
      viewedAt,
    },
  });

  // Soft trim: keep only the newest N records for this user
  const overflow = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    skip: RECENTLY_VIEWED_LIMIT,
    select: { id: true },
  });

  if (overflow.length > 0) {
    await prisma.recentlyViewed.deleteMany({
      where: { id: { in: overflow.map((row) => row.id) } },
    });
  }

  return { ok: true as const };
}

export async function getRecentlyViewedMachines(
  userId: string,
  limit = RECENTLY_VIEWED_LIMIT
): Promise<{ items: RecentlyViewedMachine[]; total: number }> {
  try {
    const [rows, total] = await Promise.all([
      prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: Math.min(Math.max(limit, 1), RECENTLY_VIEWED_LIMIT),
        select: {
          id: true,
          viewedAt: true,
          machine: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              year: true,
              hours: true,
              condition: true,
              location: true,
              status: true,
              brand: { select: { name: true } },
              category: { select: { name: true } },
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      }),
      prisma.recentlyViewed.count({ where: { userId } }),
    ]);

    const items: RecentlyViewedMachine[] = rows.map((row) => ({
      recordId: row.id,
      viewedAt: row.viewedAt.toISOString(),
      listingStatus: row.machine.status,
      available: row.machine.status === "PUBLISHED",
      id: row.machine.id,
      title: row.machine.title,
      slug: row.machine.slug,
      price: row.machine.price,
      year: row.machine.year,
      hours: row.machine.hours,
      condition: row.machine.condition,
      location: row.machine.location,
      imageUrl: row.machine.images[0]?.url ?? null,
      brandName: row.machine.brand.name,
      categoryName: row.machine.category.name,
      isPremium: false,
    }));

    return { items, total };
  } catch (error) {
    logRecentlyViewedError("getRecentlyViewedMachines", error);
    throw error;
  }
}

export async function removeRecentlyViewed(userId: string, machineId: string) {
  const result = await prisma.recentlyViewed.deleteMany({
    where: { userId, machineId },
  });
  return result.count > 0;
}

export async function clearRecentlyViewed(userId: string) {
  const result = await prisma.recentlyViewed.deleteMany({
    where: { userId },
  });
  return result.count;
}
