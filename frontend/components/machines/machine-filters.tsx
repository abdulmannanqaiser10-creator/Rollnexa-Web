"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, X } from "lucide-react";
import {
  MACHINE_CONDITIONS,
  MACHINE_SORT_OPTIONS,
  MAX_YEAR,
  MIN_YEAR,
  SORT_LABELS,
  buildMachinesQueryString,
  type MachineBrowseFilters,
  type MachineSort,
} from "@/lib/validations/machine-filters";

type Option = { id: string; name: string; slug: string };

type MachineFiltersProps = {
  filters: MachineBrowseFilters;
  categories: Option[];
  brands: Option[];
  basePath?: string;
  /** When set, category cannot be changed from this page. */
  lockCategory?: boolean;
  /** When set, brand cannot be changed from this page. */
  lockBrand?: boolean;
};

type DraftState = {
  search: string;
  category: string;
  brand: string;
  location: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  sort: MachineSort;
};

function toDraft(filters: MachineBrowseFilters): DraftState {
  return {
    search: filters.search,
    category: filters.category,
    brand: filters.brand,
    location: filters.location,
    condition: filters.condition || "",
    minPrice: filters.minPrice != null ? String(filters.minPrice) : "",
    maxPrice: filters.maxPrice != null ? String(filters.maxPrice) : "",
    minYear: filters.minYear != null ? String(filters.minYear) : "",
    maxYear: filters.maxYear != null ? String(filters.maxYear) : "",
    sort: filters.sort,
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function MachineFilters({
  filters,
  categories,
  brands,
  basePath = "/machines",
  lockCategory = false,
  lockBrand = false,
}: MachineFiltersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<DraftState>(() => toDraft(filters));

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.search) count += 1;
    if (filters.category && !lockCategory) count += 1;
    if (filters.brand && !lockBrand) count += 1;
    if (filters.location) count += 1;
    if (filters.condition) count += 1;
    if (filters.minPrice != null || filters.maxPrice != null) count += 1;
    if (filters.minYear != null || filters.maxYear != null) count += 1;
    return count;
  }, [filters, lockBrand, lockCategory]);

  function navigate(next: Partial<MachineBrowseFilters>) {
    const href = buildMachinesQueryString(
      filters,
      { ...next, page: 1 },
      basePath
    );
    startTransition(() => {
      router.push(href);
      setOpen(false);
    });
  }

  function applyDraft(event: React.FormEvent) {
    event.preventDefault();
    navigate({
      search: draft.search,
      category: lockCategory ? filters.category : draft.category,
      brand: lockBrand ? filters.brand : draft.brand,
      location: draft.location,
      condition: (draft.condition || undefined) as MachineBrowseFilters["condition"],
      minPrice: parseOptionalNumber(draft.minPrice),
      maxPrice: parseOptionalNumber(draft.maxPrice),
      minYear: parseOptionalNumber(draft.minYear),
      maxYear: parseOptionalNumber(draft.maxYear),
      sort: draft.sort,
      page: 1,
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push(
        buildMachinesQueryString(
          {
            category: lockCategory ? filters.category : "",
            brand: lockBrand ? filters.brand : "",
          },
          { page: 1 },
          basePath
        )
      );
      setOpen(false);
    });
  }

  function onSortChange(sort: MachineSort) {
    navigate({ sort, page: 1 });
  }

  const filterFields = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="block sm:col-span-2 xl:col-span-4">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Search Machines
        </span>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-rn-muted" />
          <input
            value={draft.search}
            onChange={(e) => setDraft((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Road roller, excavator, brand..."
            className="h-11 w-full rounded-lg border border-black/10 bg-white pr-3 pl-9 text-sm outline-none focus:border-rn-gold"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Category
        </span>
        <select
          value={draft.category}
          disabled={lockCategory}
          onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold disabled:cursor-not-allowed disabled:bg-rn-surface disabled:opacity-80"
        >
          <option value="">All Categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Brand
        </span>
        <select
          value={draft.brand}
          disabled={lockBrand}
          onChange={(e) => setDraft((prev) => ({ ...prev, brand: e.target.value }))}
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold disabled:cursor-not-allowed disabled:bg-rn-surface disabled:opacity-80"
        >
          <option value="">All Brands</option>
          {brands.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Condition
        </span>
        <select
          value={draft.condition}
          onChange={(e) => setDraft((prev) => ({ ...prev, condition: e.target.value }))}
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold"
        >
          <option value="">Any Condition</option>
          {MACHINE_CONDITIONS.map((item) => (
            <option key={item} value={item}>
              {item.charAt(0) + item.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Location
        </span>
        <input
          value={draft.location}
          onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
          placeholder="City or region"
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Min Price
        </span>
        <input
          type="number"
          min={0}
          value={draft.minPrice}
          onChange={(e) => setDraft((prev) => ({ ...prev, minPrice: e.target.value }))}
          placeholder="e.g. 20000"
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Max Price
        </span>
        <input
          type="number"
          min={0}
          value={draft.maxPrice}
          onChange={(e) => setDraft((prev) => ({ ...prev, maxPrice: e.target.value }))}
          placeholder="e.g. 80000"
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          From Year
        </span>
        <input
          type="number"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={draft.minYear}
          onChange={(e) => setDraft((prev) => ({ ...prev, minYear: e.target.value }))}
          placeholder={String(MIN_YEAR)}
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-rn-muted uppercase">
          To Year
        </span>
        <input
          type="number"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={draft.maxYear}
          onChange={(e) => setDraft((prev) => ({ ...prev, maxYear: e.target.value }))}
          placeholder={String(MAX_YEAR)}
          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-rn-gold"
        />
      </label>
    </div>
  );

  return (
    <div className="mb-6 space-y-4">
      <form onSubmit={applyDraft} className="rn-card hidden space-y-4 p-4 lg:block">
        {filterFields}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-black/10 px-4 text-sm font-semibold text-rn-ink"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink disabled:opacity-60"
          >
            {pending ? "Applying..." : "Apply Filters"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:hidden">
        <button
          type="button"
          onClick={() => {
            setDraft(toDraft(filters));
            setOpen(true);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-rn-ink"
        >
          <Filter className="size-4" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>

        <label className="flex items-center gap-2 text-sm text-rn-muted">
          <span className="whitespace-nowrap">Sort by</span>
          <select
            value={filters.sort}
            onChange={(e) => onSortChange(e.target.value as MachineSort)}
            className="h-11 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm text-rn-ink outline-none focus:border-rn-gold"
          >
            {MACHINE_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="hidden items-center justify-end lg:flex">
        <label className="flex items-center gap-2 text-sm text-rn-muted">
          <span>Sort by</span>
          <select
            value={filters.sort}
            onChange={(e) => onSortChange(e.target.value as MachineSort)}
            className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm text-rn-ink outline-none focus:border-rn-gold"
          >
            {MACHINE_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-rn-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-black/10"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={applyDraft} className="space-y-4">
              {filterFields}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 rounded-lg border border-black/10 text-sm font-semibold text-rn-ink"
                >
                  Clear Filters
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-11 rounded-lg bg-rn-gold text-sm font-bold text-rn-ink disabled:opacity-60"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
