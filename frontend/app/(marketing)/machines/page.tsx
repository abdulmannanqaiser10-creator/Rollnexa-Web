import Link from "next/link";
import type { Metadata } from "next";
import { browseMachines, getBrowseFilterOptions } from "@/lib/machines/query";
import {
  buildMachinesQueryString,
  parseMachineBrowseFilters,
} from "@/lib/validations/machine-filters";
import { MachineFilters } from "@/components/machines/machine-filters";
import { ActiveFilters } from "@/components/machines/active-filters";
import { EmptyMachines, MachineGrid } from "@/components/machines/machine-grid";
import { MachinePagination } from "@/components/machines/machine-pagination";
import { buildCollectionPageSchema, buildMetadata } from "@/lib/seo";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = buildMetadata({
  title: "Browse Machines",
  description:
    "Find the right heavy construction equipment for your project. Filter by category, brand, location, and condition on Rollnexa.",
  path: "/machines",
  keywords: ["browse machines", "heavy equipment listings", "used construction machines"],
});

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseMachineBrowseFilters(params);

  let result: Awaited<ReturnType<typeof browseMachines>>;
  let options: Awaited<ReturnType<typeof getBrowseFilterOptions>>;

  try {
    [result, options] = await Promise.all([
      browseMachines(filters),
      getBrowseFilterOptions(),
    ]);
  } catch (error) {
    console.error("[machines] Failed to load browse page:", error);
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
              href="/machines"
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
      <SeoJsonLd
        data={buildCollectionPageSchema({
          path: "/machines",
          name: "Browse Machines",
          description:
            "Find the right heavy construction equipment for your project on Rollnexa.",
          itemCount: pagination.total,
        })}
      />
      <div className="rn-container">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="rn-eyebrow">
              Inventory
            </p>
            <h1 className="rn-page-title">
              Browse Machines
            </h1>
            <p className="mt-2 text-sm text-rn-muted">
              Find the right heavy equipment for your project.
            </p>
          </div>
          <Link
            href="/sell"
            className="rn-btn-primary"
          >
            Post Listing
          </Link>
        </div>

        <MachineFilters
          key={buildMachinesQueryString(filters)}
          filters={filters}
          categories={options.categories}
          brands={options.brands}
        />

        <ActiveFilters
          filters={result.filters}
          categories={options.categories}
          brands={options.brands}
        />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-rn-muted">
            {pagination.total === 0
              ? "No machines found"
              : `Showing ${machines.length} of ${pagination.total} machine${
                  pagination.total === 1 ? "" : "s"
                }`}
          </p>
          <p className="text-sm text-rn-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>

        {machines.length === 0 ? (
          <EmptyMachines />
        ) : (
          <>
            <MachineGrid machines={machines} />
            <MachinePagination pagination={pagination} filters={result.filters} />
          </>
        )}
      </div>
    </div>
  );
}
