import Link from "next/link";
import type { Metadata } from "next";
import { getCategories } from "@/lib/catalog/query";
import { CategoryCard } from "@/components/machines/category-card";
import { buildCollectionPageSchema, buildMetadata } from "@/lib/seo";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Machine Categories",
  description:
    "Browse heavy construction equipment by category on Rollnexa — road rollers, excavators, loaders, and more.",
  path: "/categories",
  keywords: ["machine categories", "excavators", "road rollers", "loaders"],
});

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    categories = await getCategories();
  } catch (error) {
    console.error("[categories] Failed to load categories:", error);
    return (
      <div className="bg-rn-surface py-14">
        <div className="rn-container">
          <div className="rn-card p-10 text-center">
            <h1 className="font-display text-2xl font-bold text-rn-ink">
              Unable to load categories
            </h1>
            <p className="mt-2 text-sm text-rn-muted">
              Please try again in a moment.
            </p>
            <Link
              href="/categories"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Retry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rn-surface py-10 sm:py-12">
      <SeoJsonLd
        data={buildCollectionPageSchema({
          path: "/categories",
          name: "Machine Categories",
          description:
            "Browse heavy construction equipment by category on Rollnexa.",
          itemCount: categories.length,
        })}
      />
      <div className="rn-container">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
              Browse by Type
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink sm:text-4xl">
              Machine Categories
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-rn-muted">
              Explore heavy construction equipment by category and find the right
              machine faster.
            </p>
          </div>
          <Link
            href="/machines"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold text-rn-ink"
          >
            Browse All Machines
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="rn-card p-10 text-center">
            <h2 className="font-display text-2xl font-bold text-rn-ink">
              No categories available
            </h2>
            <p className="mt-2 text-sm text-rn-muted">
              Categories will appear here once they are added to the marketplace.
            </p>
            <Link
              href="/machines"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Browse All Machines
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
