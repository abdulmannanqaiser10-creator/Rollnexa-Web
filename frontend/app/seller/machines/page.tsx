import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { requireRole } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { parseListingDescription } from "@/lib/machines/detail";
import { listSellerMachines } from "@/lib/seller/list-machines";
import { sellerMachinesQuerySchema } from "@/lib/validations/seller-machines";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";
import { MachineActionMenu } from "@/components/seller/MachineActionMenu";
import { SellerListingFeedback } from "@/components/seller/SellerListingFeedback";
import { EmptyState } from "@/components/seller/EmptyState";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "My Machines — Rollnexa",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SellerMachinesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("SELLER");
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const parsedQuery = sellerMachinesQuerySchema.safeParse({
    q: first(params.q),
    status: first(params.status)?.toUpperCase(),
    category: first(params.category),
    sort: first(params.sort),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });

  const query = parsedQuery.success
    ? parsedQuery.data
    : sellerMachinesQuerySchema.parse({});

  let result: Awaited<ReturnType<typeof listSellerMachines>> = {
    items: [],
    total: 0,
    totalPages: 1,
  };
  let loadError: string | null = null;

  try {
    result = await listSellerMachines(session.user.id, query);
  } catch (error) {
    console.error("[seller/machines] Failed to load machines:", error);
    loadError = "Unable to load your machines. Please try again.";
  }

  const categories = await prisma.category.findMany({
    where: { machines: { some: { sellerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const machines = result.items;

  function buildHref(updates: Partial<typeof query>) {
    const p = new URLSearchParams();
    const merged = { ...query, ...updates };
    if (merged.q) p.set("q", merged.q);
    if (merged.status !== "ALL") p.set("status", merged.status.toLowerCase());
    if (merged.category) p.set("category", merged.category);
    if (merged.sort !== "newest") p.set("sort", merged.sort);
    if (merged.page > 1) p.set("page", String(merged.page));
    if (merged.pageSize !== 12) p.set("pageSize", String(merged.pageSize));
    const qs = p.toString();
    return qs ? `/seller/machines?${qs}` : "/seller/machines";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#111827]">
            My Machines
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            {result.total} listing{result.total === 1 ? "" : "s"} in your
            inventory · Page {query.page} of {result.totalPages}
          </p>
        </div>
        <Link
          href="/seller/machines/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12] transition hover:bg-[#FFB800]"
        >
          <Plus className="size-4" />
          Add Machine
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h3 className="font-display text-xl font-bold text-[#111827]">
            Unable to load machines
          </h3>
          <p className="mt-2 text-sm text-[#6B7280]">{loadError}</p>
          <Link
            href="/seller/machines"
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12]"
          >
            Try Again
          </Link>
        </div>
      ) : (
        <section className="space-y-4">
          <form
            className="grid gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5"
            action="/seller/machines"
            method="GET"
          >
            <label className="sm:col-span-2 xl:col-span-2">
              <span className="mb-1 block text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Search
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B7280]" />
                <input
                  name="q"
                  defaultValue={query.q ?? ""}
                  placeholder="Title, location, description"
                  className="h-10 w-full rounded-lg border border-black/10 bg-white pr-3 pl-9 text-sm outline-none focus:border-[#F5B800]"
                />
              </span>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Status
              </span>
              <select
                name="status"
                defaultValue={query.status}
                className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#F5B800]"
              >
                <option value="ALL">All</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="REJECTED">Rejected</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="SOLD">Sold</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Category
              </span>
              <select
                name="category"
                defaultValue={query.category ?? ""}
                className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#F5B800]"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Sort
              </span>
              <select
                name="sort"
                defaultValue={query.sort}
                className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#F5B800]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_desc">Price high to low</option>
                <option value="price_asc">Price low to high</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
              </select>
            </label>
            <input type="hidden" name="page" value="1" />
            <div className="sm:col-span-2 xl:col-span-5 flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg bg-[#080D12] px-4 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Apply Filters
              </button>
              <Link
                href="/seller/machines"
                className="inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-[#111827] hover:border-[#F5B800]"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>
      )}

      {!loadError && machines.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <EmptyState
            title="No machines listed yet."
            description="Start selling your heavy equipment today, or adjust your filters."
            actionHref="/seller/machines/new"
            actionLabel="Add Your First Machine"
          />
        </div>
      ) : loadError ? null : (
        <div className="rounded-2xl border border-black/5 bg-white shadow-[0_10px_30px_rgba(8,13,18,0.04)]">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[920px] w-full text-left overflow-visible">
              <thead>
                <tr className="border-b border-black/5 bg-[#F6F7F9] text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                  <th className="px-4 py-3">Machine</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {machines.map((machine) => {
                  const { model } = parseListingDescription(machine.description);
                  return (
                    <tr key={machine.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-20 overflow-hidden rounded-xl bg-[#F6F7F9]">
                            {machine.images[0]?.url ? (
                              <Image
                                src={machine.images[0].url}
                                alt={machine.title}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-[10px] text-[#6B7280]">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/machines/${machine.slug}`}
                              className="font-semibold text-[#111827] hover:text-[#B8860B]"
                            >
                              {machine.title}
                            </Link>
                            <p className="mt-0.5 text-xs text-[#6B7280]">
                              {[machine.brand.name, model, machine.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#111827]">
                        {formatPrice(machine.price)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <MachineStatusBadge status={machine.status} />
                          {(machine.status === "REJECTED" || machine.status === "PENDING_REVIEW") ? (
                            <SellerListingFeedback
                              status={machine.status}
                              rejectionReason={machine.rejectionReason}
                              rejectedAt={machine.rejectedAt?.toISOString()}
                              machineId={machine.id}
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">
                        {machine.views.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">
                        {machine._count.inquiries} inq ·{" "}
                        {machine._count.favorites} saves
                      </td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">
                        {machine.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <MachineActionMenu
                            machineId={machine.id}
                            machineSlug={machine.slug}
                            machineTitle={machine.title}
                            status={machine.status}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loadError && result.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2" aria-label="Machine pages">
          <Link
            href={buildHref({ page: Math.max(1, query.page - 1) })}
            aria-disabled={query.page <= 1}
            className={`inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-[#111827] ${
              query.page <= 1 ? "pointer-events-none opacity-40" : "hover:border-[#F5B800]"
            }`}
          >
            Previous
          </Link>
          <span className="text-sm text-[#6B7280]">
            {query.page} / {result.totalPages}
          </span>
          <Link
            href={buildHref({ page: Math.min(result.totalPages, query.page + 1) })}
            aria-disabled={query.page >= result.totalPages}
            className={`inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-[#111827] ${
              query.page >= result.totalPages
                ? "pointer-events-none opacity-40"
                : "hover:border-[#F5B800]"
            }`}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
