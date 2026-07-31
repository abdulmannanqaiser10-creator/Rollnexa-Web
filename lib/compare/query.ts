import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { parseListingDescription } from "@/lib/machines/detail";
import type { CompareMachineDetail } from "@/lib/compare/types";

export type { CompareMachineDetail } from "@/lib/compare/types";

/** Keep in sync with `MAX_COMPARE` in compare-store. */
export const COMPARE_LIMIT = 3;

const uuidSchema = z.string().uuid();

function formatCondition(condition: string) {
  return condition.charAt(0) + condition.slice(1).toLowerCase();
}

export function parseCompareIds(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw.join(",") : raw || "";
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const ids: string[] = [];
  for (const part of parts) {
    const parsed = uuidSchema.safeParse(part);
    if (!parsed.success) continue;
    if (!ids.includes(parsed.data)) ids.push(parsed.data);
    if (ids.length >= COMPARE_LIMIT) break;
  }
  return ids;
}

export async function getMachinesForCompare(
  ids: string[]
): Promise<CompareMachineDetail[]> {
  if (ids.length === 0) return [];

  const safeIds = parseCompareIds(ids.join(","));
  if (safeIds.length === 0) return [];

  const machines = await prisma.machine.findMany({
    where: {
      id: { in: safeIds },
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      year: true,
      hours: true,
      condition: true,
      location: true,
      description: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      seller: {
        select: {
          name: true,
          profile: { select: { companyName: true } },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  const byId = new Map(machines.map((machine) => [machine.id, machine]));

  // Preserve request order; drop missing / unpublished
  return safeIds
    .map((id) => byId.get(id))
    .filter((machine): machine is NonNullable<typeof machine> => Boolean(machine))
    .map((machine) => {
      const { model } = parseListingDescription(machine.description);
      return {
        id: machine.id,
        title: machine.title,
        slug: machine.slug,
        price: machine.price,
        priceLabel: formatPrice(machine.price),
        year: machine.year,
        hours: machine.hours,
        condition: machine.condition,
        conditionLabel: formatCondition(machine.condition),
        location: machine.location,
        model,
        imageUrl: machine.images[0]?.url ?? null,
        brandName: machine.brand.name,
        categoryName: machine.category.name,
        sellerName:
          machine.seller.profile?.companyName ||
          machine.seller.name ||
          "Seller",
      };
    });
}
