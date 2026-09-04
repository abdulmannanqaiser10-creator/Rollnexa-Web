import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { queryAdminMachines } from "@/lib/admin/listings-query";
import { adminMachinesQuerySchema } from "@/lib/validations/admin";
import { AdminListingModerationActions } from "@/components/admin/AdminListingModerationActions";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";
import { formatPrice } from "@/lib/format";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";

export const metadata = { title: "Approval Queue — Rollnexa Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const params = await searchParams;
  const query = adminMachinesQuerySchema.parse({
    q: first(params.q),
    status: first(params.status) ?? "PENDING_REVIEW",
    category: first(params.category),
    brand: first(params.brand),
    seller: first(params.seller),
    sort: first(params.sort),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });

  const [{ machines, total, totalPages }, categories, brands, pendingCount] =
    await Promise.all([
      queryAdminMachines(query),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.machine.count({ where: { status: "PENDING_REVIEW" } }),
    ]);

  function pageHref(page: number) {
    const p = new URLSearchParams();
    if (query.q) p.set("q", query.q);
    if (query.status !== "PENDING_REVIEW") p.set("status", query.status);
    if (query.category) p.set("category", query.category);
    if (query.brand) p.set("brand", query.brand);
    if (query.seller) p.set("seller", query.seller);
    if (query.sort !== "newest") p.set("sort", query.sort);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    return qs ? `/admin/approvals?${qs}` : "/admin/approvals";
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rn-eyebrow">Moderation</p>
          <h1 className="rn-page-title">Approval Queue</h1>
          <p className="mt-2 text-sm text-rn-muted">
            {pendingCount.toLocaleString()} listing{pendingCount === 1 ? "" : "s"} awaiting review
          </p>
        </div>
        <Link href="/admin/machines" className="rn-btn-secondary h-10 px-4 text-sm">
          All Listings
        </Link>
      </header>

      <form className="rn-panel grid gap-3 sm:grid-cols-2 xl:grid-cols-6" action="/admin/approvals" method="GET">
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Search title, location, seller"
          className="h-10 rounded-lg border border-black/10 px-3 text-sm sm:col-span-2"
        />
        <select name="status" defaultValue={query.status} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All statuses</option>
        </select>
        <select name="category" defaultValue={query.category} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="brand" defaultValue={query.brand} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select name="sort" defaultValue={query.sort} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="newest">Newest submitted</option>
          <option value="oldest">Oldest submitted</option>
          <option value="price_desc">Price high to low</option>
          <option value="price_asc">Price low to high</option>
        </select>
        <button type="submit" className="rn-btn-primary h-10 sm:col-span-2 xl:col-span-6">
          Apply Filters
        </button>
      </form>

      {machines.length === 0 ? (
        <div className="rn-panel py-16 text-center">
          <p className="font-display text-lg font-bold text-rn-ink">Queue is clear</p>
          <p className="mt-2 text-sm text-rn-muted">No listings match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {machines.map((machine) => (
            <article key={machine.id} className="rn-panel overflow-hidden">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-rn-surface">
                    {machine.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMachineImageUrl(machine.images[0].url) ?? machine.images[0].url}
                        alt={machine.images[0].alt || machine.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-rn-muted">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-rn-ink">{machine.title}</h2>
                      <MachineStatusBadge status={machine.status} />
                    </div>
                    <p className="mt-1 text-sm text-rn-muted">
                      {machine.seller.name || machine.seller.email} · {machine.category.name} · {machine.brand.name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-rn-ink">
                      {formatPrice(machine.price)} · {machine.location || "Location not set"}
                    </p>
                    <p className="mt-1 text-xs text-rn-muted">
                      Submitted{" "}
                      {machine.submittedForReviewAt
                        ? new Date(machine.submittedForReviewAt).toLocaleString()
                        : new Date(machine.createdAt).toLocaleString()}
                    </p>
                    {machine.rejectionReason ? (
                      <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                        Previous rejection: {machine.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                  <Link
                    href={`/admin/machines/${machine.id}`}
                    className="rn-btn-secondary h-9 px-3 text-xs"
                  >
                    Review Listing
                  </Link>
                  <AdminListingModerationActions
                    machineId={machine.id}
                    machineTitle={machine.title}
                    status={machine.status}
                    isFeatured={machine.isFeatured}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-rn-muted">
        <p>{total.toLocaleString()} listings</p>
        <div className="flex gap-2">
          {query.page > 1 ? (
            <Link href={pageHref(query.page - 1)} className="rn-btn-secondary h-9 px-3 text-xs">
              Previous
            </Link>
          ) : null}
          {query.page < totalPages ? (
            <Link href={pageHref(query.page + 1)} className="rn-btn-secondary h-9 px-3 text-xs">
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
