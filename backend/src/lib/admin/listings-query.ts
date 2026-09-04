import "server-only";

import { prisma } from "@/lib/db";
import type { adminMachinesQuerySchema } from "@/lib/validations/admin";
import type { z } from "zod";

export type AdminMachinesQuery = z.infer<typeof adminMachinesQuerySchema>;

export function buildAdminMachinesWhere(query: AdminMachinesQuery) {
  return {
    ...(query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.category ? { categoryId: query.category } : {}),
    ...(query.brand ? { brandId: query.brand } : {}),
    ...(query.seller ? { sellerId: query.seller } : {}),
    ...(query.featured === "YES" ? { isFeatured: true } : {}),
    ...(query.featured === "NO" ? { isFeatured: false } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { location: { contains: query.q, mode: "insensitive" as const } },
            { seller: { email: { contains: query.q, mode: "insensitive" as const } } },
            { seller: { name: { contains: query.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
}

export function buildAdminMachinesOrderBy(query: AdminMachinesQuery) {
  if (query.sort === "oldest") return { createdAt: "asc" as const };
  if (query.sort === "price_desc") return { price: "desc" as const };
  if (query.sort === "price_asc") return { price: "asc" as const };
  if (query.status === "PENDING_REVIEW") {
    return { submittedForReviewAt: "desc" as const };
  }
  return { createdAt: "desc" as const };
}

const machineListSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  location: true,
  status: true,
  isFeatured: true,
  createdAt: true,
  submittedForReviewAt: true,
  rejectionReason: true,
  seller: { select: { id: true, name: true, email: true } },
  category: { select: { name: true } },
  brand: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true, alt: true } },
} as const;

export async function queryAdminMachines(query: AdminMachinesQuery) {
  const where = buildAdminMachinesWhere(query);
  const orderBy = buildAdminMachinesOrderBy(query);

  const [machines, total] = await Promise.all([
    prisma.machine.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: machineListSelect,
    }),
    prisma.machine.count({ where }),
  ]);

  return {
    machines,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getAdminMachineReview(id: string) {
  return prisma.machine.findUnique({
    where: { id },
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
      isFeatured: true,
      rejectionReason: true,
      rejectedAt: true,
      submittedForReviewAt: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          accountStatus: true,
          profile: { select: { companyName: true, phone: true, city: true, country: true } },
        },
      },
      category: { select: { name: true } },
      brand: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      rejectedBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
    },
  });
}
