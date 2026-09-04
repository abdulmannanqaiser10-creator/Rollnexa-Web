import Link from "next/link";
import { X } from "lucide-react";
import {
  buildMachinesQueryString,
  formatFilterPrice,
  type MachineBrowseFilters,
} from "@/lib/validations/machine-filters";

type Option = { name: string; slug: string };

type ActiveFiltersProps = {
  filters: MachineBrowseFilters;
  categories: Option[];
  brands: Option[];
  basePath?: string;
  lockCategory?: boolean;
  lockBrand?: boolean;
};

export function ActiveFilters({
  filters,
  categories,
  brands,
  basePath = "/machines",
  lockCategory = false,
  lockBrand = false,
}: ActiveFiltersProps) {
  const chips: { key: string; label: string; href: string }[] = [];

  if (filters.search) {
    chips.push({
      key: "search",
      label: `Search: ${filters.search}`,
      href: buildMachinesQueryString(filters, { search: "", page: 1 }, basePath),
    });
  }

  if (filters.category && !lockCategory) {
    const category = categories.find((item) => item.slug === filters.category);
    chips.push({
      key: "category",
      label: category?.name || filters.category,
      href: buildMachinesQueryString(filters, { category: "", page: 1 }, basePath),
    });
  }

  if (filters.brand && !lockBrand) {
    const brand = brands.find((item) => item.slug === filters.brand);
    chips.push({
      key: "brand",
      label: brand?.name || filters.brand,
      href: buildMachinesQueryString(filters, { brand: "", page: 1 }, basePath),
    });
  }

  if (filters.location) {
    chips.push({
      key: "location",
      label: `Location: ${filters.location}`,
      href: buildMachinesQueryString(filters, { location: "", page: 1 }, basePath),
    });
  }

  if (filters.condition) {
    chips.push({
      key: "condition",
      label: filters.condition.charAt(0) + filters.condition.slice(1).toLowerCase(),
      href: buildMachinesQueryString(
        filters,
        { condition: undefined, page: 1 },
        basePath
      ),
    });
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const minLabel =
      filters.minPrice != null ? formatFilterPrice(filters.minPrice) : "Any";
    const maxLabel =
      filters.maxPrice != null ? formatFilterPrice(filters.maxPrice) : "Any";
    chips.push({
      key: "price",
      label: `Price: ${minLabel} – ${maxLabel}`,
      href: buildMachinesQueryString(
        filters,
        {
          minPrice: undefined,
          maxPrice: undefined,
          page: 1,
        },
        basePath
      ),
    });
  }

  if (filters.minYear != null || filters.maxYear != null) {
    const minLabel = filters.minYear != null ? String(filters.minYear) : "Any";
    const maxLabel = filters.maxYear != null ? String(filters.maxYear) : "Any";
    chips.push({
      key: "year",
      label: `Year: ${minLabel} – ${maxLabel}`,
      href: buildMachinesQueryString(
        filters,
        {
          minYear: undefined,
          maxYear: undefined,
          page: 1,
        },
        basePath
      ),
    });
  }

  if (chips.length === 0) return null;

  const clearHref = buildMachinesQueryString(
    {
      category: lockCategory ? filters.category : "",
      brand: lockBrand ? filters.brand : "",
    },
    { page: 1 },
    basePath
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold tracking-wide text-rn-muted uppercase">
        Active Filters
      </span>
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-rn-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-rn-ink transition hover:border-rn-gold"
        >
          {chip.label}
          <X className="size-3.5" />
        </Link>
      ))}
      <Link
        href={clearHref}
        className="text-xs font-semibold text-rn-ink underline-offset-4 hover:underline"
      >
        Clear All
      </Link>
    </div>
  );
}
