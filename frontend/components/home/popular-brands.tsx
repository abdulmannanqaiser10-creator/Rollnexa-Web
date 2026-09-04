import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";

type Brand = {
  id: string;
  name: string;
  slug: string;
};

type PopularBrandsProps = {
  brands: Brand[];
};

export function PopularBrands({ brands }: PopularBrandsProps) {
  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          eyebrow="Trusted Names"
          title="Popular Brands"
          description="Browse inventory from leading heavy equipment manufacturers."
          href="/brands"
          linkLabel="View All Brands"
        />

        {brands.length === 0 ? (
          <div className="rn-card p-8 text-center text-sm text-rn-muted">
            Brands will appear here once they are available.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${encodeURIComponent(brand.slug)}`}
                className="rn-card flex min-h-28 items-center justify-center px-4 py-6 text-center transition hover:-translate-y-0.5 hover:border-rn-gold/40 hover:shadow-[0_14px_30px_rgba(8,13,18,0.1)]"
              >
                <span className="font-display text-lg font-bold tracking-tight text-rn-ink">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
