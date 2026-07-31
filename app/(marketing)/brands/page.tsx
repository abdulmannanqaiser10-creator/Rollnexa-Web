import Link from "next/link";
import { getBrands } from "@/lib/catalog/query";
import { BrandCard } from "@/components/brands/brand-card";

export const metadata = {
  title: "Equipment Brands | Rollnexa",
  description:
    "Browse heavy construction equipment by brand on Rollnexa — Caterpillar, JCB, Volvo, Komatsu, HAMM, and more.",
};

export default async function BrandsPage() {
  let brands: Awaited<ReturnType<typeof getBrands>> = [];

  try {
    brands = await getBrands();
  } catch (error) {
    console.error("[brands] Failed to load brands:", error);
    return (
      <div className="bg-rn-surface py-14">
        <div className="rn-container">
          <div className="rn-card p-10 text-center">
            <h1 className="font-display text-2xl font-bold text-rn-ink">
              Unable to load brands
            </h1>
            <p className="mt-2 text-sm text-rn-muted">
              Please try again in a moment.
            </p>
            <Link
              href="/brands"
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
      <div className="rn-container">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
              Trusted Names
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink sm:text-4xl">
              Equipment Brands
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-rn-muted">
              Browse inventory from leading heavy equipment manufacturers.
            </p>
          </div>
          <Link
            href="/machines"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold text-rn-ink"
          >
            Browse All Machines
          </Link>
        </div>

        {brands.length === 0 ? (
          <div className="rn-card p-10 text-center">
            <h2 className="font-display text-2xl font-bold text-rn-ink">
              No brands available
            </h2>
            <p className="mt-2 text-sm text-rn-muted">
              Brands will appear here once they are added to the marketplace.
            </p>
            <Link
              href="/machines"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Browse All Machines
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
