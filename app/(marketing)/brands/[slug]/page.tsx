import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBrandBySlug } from "@/lib/catalog/query";
import { browseMachines, getBrowseFilterOptions } from "@/lib/machines/query";
import {
  buildMachinesQueryString,
  parseMachineBrowseFilters,
} from "@/lib/validations/machine-filters";
import { MachineFilters } from "@/components/machines/machine-filters";
import { ActiveFilters } from "@/components/machines/active-filters";
import { EmptyMachines, MachineGrid } from "@/components/machines/machine-grid";
import { MachinePagination } from "@/components/machines/machine-pagination";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug).catch(() => null);

  if (!brand) {
    return { title: "Brand Not Found | Rollnexa" };
  }

  return {
    title: `${brand.name} Machines | Rollnexa`,
    description: `Browse ${brand.name} heavy equipment available on Rollnexa.`,
  };
}

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug).catch(() => null);

  if (!brand) {
    notFound();
  }

  const rawParams = await searchParams;
  const parsed = parseMachineBrowseFilters(rawParams);
  const filters = { ...parsed, brand: brand.slug };
  const basePath = `/brands/${encodeURIComponent(brand.slug)}`;

  let result: Awaited<ReturnType<typeof browseMachines>>;
  let options: Awaited<ReturnType<typeof getBrowseFilterOptions>>;

  try {
    [result, options] = await Promise.all([
      browseMachines(filters),
      getBrowseFilterOptions(),
    ]);
  } catch (error) {
    console.error("[brands] Failed to load brand machines:", error);
    return (
      <div className="bg-rn-surface py-14">
        <div className="rn-container">
          <div className="rn-card p-10 text-center">
            <h1 className="font-display text-2xl font-bold text-rn-ink">
              Unable to load machines
            </h1>
            <p className="mt-2 text-sm text-rn-muted">
              Please try again in a moment.
            </p>
            <Link
              href={basePath}
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Retry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { machines, pagination } = result;

  return (
    <div className="bg-rn-surface py-10 sm:py-12">
      <div className="rn-container">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            Brand
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-xl bg-rn-ink font-display text-2xl font-bold text-rn-gold">
              {brand.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-rn-ink sm:text-4xl">
                {brand.name} Machines
              </h1>
              <p className="mt-1 text-sm text-rn-muted">
                Browse {brand.name} heavy equipment available on Rollnexa.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-rn-ink">
            Total Machines: {brand.machineCount}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/brands"
              className="inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-rn-ink"
            >
              All Brands
            </Link>
            <Link
              href="/machines"
              className="inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-rn-ink"
            >
              Browse All Machines
            </Link>
          </div>
        </div>

        <MachineFilters
          key={buildMachinesQueryString(filters, {}, basePath)}
          filters={filters}
          categories={options.categories}
          brands={options.brands}
          basePath={basePath}
          lockBrand
        />

        <ActiveFilters
          filters={result.filters}
          categories={options.categories}
          brands={options.brands}
          basePath={basePath}
          lockBrand
        />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-rn-muted">
            {pagination.total === 0
              ? `No machines found for ${brand.name}`
              : `Showing ${machines.length} of ${pagination.total} machine${
                  pagination.total === 1 ? "" : "s"
                }`}
          </p>
          <p className="text-sm text-rn-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>

        {machines.length === 0 ? (
          <EmptyMachines
            title="No machines found for this brand."
            description="You can browse all machines or explore other brands."
            clearHref="/machines"
            clearLabel="Browse All Machines"
          />
        ) : (
          <>
            <MachineGrid machines={machines} />
            <MachinePagination
              pagination={pagination}
              filters={result.filters}
              basePath={basePath}
            />
          </>
        )}
      </div>
    </div>
  );
}
