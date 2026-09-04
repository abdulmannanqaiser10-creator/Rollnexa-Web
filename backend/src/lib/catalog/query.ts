import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getCategoryImage } from "@/lib/home-data";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  machineCount: number;
  imageUrl: string;
};

export type CatalogBrand = {
  id: string;
  name: string;
  slug: string;
  machineCount: number;
};

const SLUG_MAX = 80;

function sanitizeSlug(slug: string) {
  return slug.trim().toLowerCase().slice(0, SLUG_MAX);
}

async function fetchCategories(): Promise<CatalogCategory[]> {
  const categories = await prisma.category.findMany({
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
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    machineCount: category._count.machines,
    imageUrl: getCategoryImage(category.slug),
  }));
}

async function fetchBrands(): Promise<CatalogBrand[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { machines: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    machineCount: brand._count.machines,
  }));
}

export const getCategories = unstable_cache(fetchCategories, ["catalog-categories"], {
  revalidate: 60,
  tags: ["catalog", "categories"],
});

export const getBrands = unstable_cache(fetchBrands, ["catalog-brands"], {
  revalidate: 60,
  tags: ["catalog", "brands"],
});

export const getCategoryBySlug = cache(async function getCategoryBySlug(
  slug: string
): Promise<CatalogCategory | null> {
  const safeSlug = sanitizeSlug(slug);
  if (!safeSlug) return null;

  const category = await prisma.category.findUnique({
    where: { slug: safeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: { machines: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    machineCount: category._count.machines,
    imageUrl: getCategoryImage(category.slug),
  };
});

export const getBrandBySlug = cache(async function getBrandBySlug(
  slug: string
): Promise<CatalogBrand | null> {
  const safeSlug = sanitizeSlug(slug);
  if (!safeSlug) return null;

  const brand = await prisma.brand.findUnique({
    where: { slug: safeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { machines: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  if (!brand) return null;

  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    machineCount: brand._count.machines,
  };
});
