import "server-only";

import { prisma } from "@/lib/db";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
import type { FavoriteMachine } from "@/lib/favorites/types";

export type { FavoriteMachine } from "@/lib/favorites/types";

function isMissingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const message =
    "message" in error ? String((error as { message?: string }).message) : "";
  return (
    code === "P2021" ||
    /relation .* does not exist/i.test(message) ||
    /table .* does not exist/i.test(message)
  );
}

export async function getBuyerFavorites(
  userId: string
): Promise<{ favorites: FavoriteMachine[]; total: number }> {
  try {
    const [rows, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
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
      prisma.favorite.count({ where: { userId } }),
    ]);

    const favorites: FavoriteMachine[] = rows.map((row) => ({
      favoriteId: row.id,
      favoritedAt: row.createdAt.toISOString(),
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
      imageUrl: resolveMachineImageUrl(row.machine.images[0]?.url),
      brandName: row.machine.brand.name,
      categoryName: row.machine.category.name,
      isPremium: false,
    }));

    return { favorites, total };
  } catch (error) {
    if (isMissingTableError(error)) {
      console.error(
        "[favorites] Favorite table missing. Run: npx prisma migrate deploy"
      );
      return { favorites: [], total: 0 };
    }
    throw error;
  }
}

export async function isMachineFavorited(
  userId: string,
  machineId: string
): Promise<boolean> {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_machineId: { userId, machineId },
      },
      select: { id: true },
    });
    return favorite !== null;
  } catch (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
}
