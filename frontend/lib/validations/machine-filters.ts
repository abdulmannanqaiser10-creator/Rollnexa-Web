import { z } from "zod";

export const MACHINE_SORT_OPTIONS = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "year-newest",
  "year-oldest",
] as const;

export type MachineSort = (typeof MACHINE_SORT_OPTIONS)[number];

export const MACHINE_CONDITIONS = ["NEW", "USED", "REFURBISHED"] as const;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 24;
export const MAX_PRICE = 100_000_000;
export const MIN_YEAR = 1950;
export const MAX_YEAR = new Date().getFullYear();

const sortSchema = z.enum(MACHINE_SORT_OPTIONS).catch("newest");
const conditionSchema = z.enum(MACHINE_CONDITIONS).optional().catch(undefined);

function optionalNonNegativeNumber(max: number) {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    if (parsed < 0 || parsed > max) return undefined;
    return parsed;
  }, z.number().optional());
}

function optionalYear() {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    const year = Math.trunc(parsed);
    if (year < MIN_YEAR || year > MAX_YEAR) return undefined;
    return year;
  }, z.number().int().optional());
}

export const machineBrowseFiltersSchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(120, "Search is too long")
      .optional()
      .default(""),
    category: z.string().trim().max(80).optional().default(""),
    brand: z.string().trim().max(80).optional().default(""),
    location: z.string().trim().max(120).optional().default(""),
    condition: conditionSchema,
    minPrice: optionalNonNegativeNumber(MAX_PRICE),
    maxPrice: optionalNonNegativeNumber(MAX_PRICE),
    minYear: optionalYear(),
    maxYear: optionalYear(),
    sort: sortSchema,
    page: z.coerce.number().int().min(1).catch(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .catch(DEFAULT_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
  })
  .transform((data) => {
    let { minPrice, maxPrice, minYear, maxYear } = data;

    if (
      minPrice != null &&
      maxPrice != null &&
      minPrice > maxPrice
    ) {
      // Swap invalid ranges instead of failing the whole browse request
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    if (minYear != null && maxYear != null && minYear > maxYear) {
      [minYear, maxYear] = [maxYear, minYear];
    }

    return {
      ...data,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
    };
  });

export type MachineBrowseFilters = z.infer<typeof machineBrowseFiltersSchema>;

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseMachineBrowseFilters(
  params: RawSearchParams
): MachineBrowseFilters {
  const search = first(params.search) || first(params.q) || "";

  return machineBrowseFiltersSchema.parse({
    search,
    category: first(params.category) || "",
    brand: first(params.brand) || "",
    location: first(params.location) || "",
    condition: first(params.condition) || undefined,
    minPrice: first(params.minPrice),
    maxPrice: first(params.maxPrice),
    minYear: first(params.minYear),
    maxYear: first(params.maxYear),
    sort: first(params.sort) || "newest",
    page: first(params.page) || 1,
    limit: first(params.limit) || DEFAULT_PAGE_SIZE,
  });
}

export function buildMachinesQueryString(
  filters: Partial<MachineBrowseFilters>,
  overrides: Partial<MachineBrowseFilters> = {},
  basePath = "/machines"
) {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.search?.trim()) params.set("q", merged.search.trim());
  if (merged.category) params.set("category", merged.category);
  if (merged.brand) params.set("brand", merged.brand);
  if (merged.location?.trim()) params.set("location", merged.location.trim());
  if (merged.condition) params.set("condition", merged.condition);
  if (merged.minPrice != null) params.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice != null) params.set("maxPrice", String(merged.maxPrice));
  if (merged.minYear != null) params.set("minYear", String(merged.minYear));
  if (merged.maxYear != null) params.set("maxYear", String(merged.maxYear));
  if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  if (merged.limit && merged.limit !== DEFAULT_PAGE_SIZE) {
    params.set("limit", String(merged.limit));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export const SORT_LABELS: Record<MachineSort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "year-newest": "Year: Newest",
  "year-oldest": "Year: Oldest",
};

export function formatFilterPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
