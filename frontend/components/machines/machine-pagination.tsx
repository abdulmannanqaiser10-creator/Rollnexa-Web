import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BrowsePagination } from "@/lib/machines/query";
import {
  buildMachinesQueryString,
  type MachineBrowseFilters,
} from "@/lib/validations/machine-filters";
import { cn } from "@/lib/utils";

type MachinePaginationProps = {
  pagination: BrowsePagination;
  filters: MachineBrowseFilters;
  basePath?: string;
};

function pageWindow(current: number, total: number) {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function MachinePagination({
  pagination,
  filters,
  basePath = "/machines",
}: MachinePaginationProps) {
  if (pagination.totalPages <= 1) return null;

  const pages = pageWindow(pagination.page, pagination.totalPages);

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Pagination"
    >
      <Link
        href={buildMachinesQueryString(
          filters,
          {
            page: Math.max(1, pagination.page - 1),
          },
          basePath
        )}
        aria-disabled={!pagination.hasPreviousPage}
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-rn-ink",
          !pagination.hasPreviousPage && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft className="size-4" />
        Previous
      </Link>

      {pages.map((page, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev != null && page - prev > 1;
        return (
          <span key={page} className="flex items-center gap-2">
            {showEllipsis ? (
              <span className="px-1 text-sm text-rn-muted">…</span>
            ) : null}
            <Link
              href={buildMachinesQueryString(filters, { page }, basePath)}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-lg border text-sm font-semibold",
                page === pagination.page
                  ? "border-rn-gold bg-rn-gold text-rn-ink"
                  : "border-black/10 bg-white text-rn-ink hover:border-rn-gold"
              )}
            >
              {page}
            </Link>
          </span>
        );
      })}

      <Link
        href={buildMachinesQueryString(
          filters,
          {
            page: Math.min(pagination.totalPages, pagination.page + 1),
          },
          basePath
        )}
        aria-disabled={!pagination.hasNextPage}
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-rn-ink",
          !pagination.hasNextPage && "pointer-events-none opacity-40"
        )}
      >
        Next
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
