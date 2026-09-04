import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const [machines, categories, brands, sellers] = await Promise.all([
    prisma.machine.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.brand.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "SELLER" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const routes = [
    "",
    "/machines",
    "/categories",
    "/brands",
    "/dealers",
    "/about",
    "/compare",
    "/contact",
    "/privacy",
    "/terms",
    "/sell",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const machineRoutes = machines.map((machine) => ({
    url: `${baseUrl}/machines/${machine.slug}`,
    lastModified: machine.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const brandRoutes = brands.map((brand) => ({
    url: `${baseUrl}/brands/${brand.slug}`,
    lastModified: brand.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const sellerRoutes = sellers.map((seller) => ({
    url: `${baseUrl}/dealers/${seller.id}`,
    lastModified: seller.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [...routes, ...machineRoutes, ...categoryRoutes, ...brandRoutes, ...sellerRoutes];
}
