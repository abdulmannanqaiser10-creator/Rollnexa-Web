import type { HomeCategory } from "@/lib/home/types";
import { CategoryCard } from "@/components/machines/category-card";
import { SectionHeader } from "@/components/home/section-header";

type PopularCategoriesProps = {
  categories: HomeCategory[];
};

export function PopularCategories({ categories }: PopularCategoriesProps) {
  return (
    <section id="categories" className="py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          eyebrow="Browse by Type"
          title="Machine Categories"
          description="Explore heavy construction equipment by category and find the right machine faster."
          href="/categories"
          linkLabel="View All Categories"
        />

        {categories.length === 0 ? (
          <div className="rn-card p-8 text-center text-sm text-rn-muted">
            Categories will appear here once they are available in the marketplace.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4 lg:gap-5">
            {categories.map((category) => (
              <div
                key={category.id}
                className="min-w-[220px] shrink-0 md:min-w-0"
              >
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
