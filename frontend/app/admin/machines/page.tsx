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

export const metadata = { title: "Machines — Rollnexa Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminMachinesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const params = await searchParams;
  const query = adminMachinesQuerySchema.parse({
    q: first(params.q),
    status: first(params.status),
    category: first(params.category),
    brand: first(params.brand),
    seller: first(params.seller),
    featured: first(params.featured),
    sort: first(params.sort),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });

  const [{ machines, total, totalPages }, categories, brands] = await Promise.all([
    queryAdminMachines(query),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  function pageHref(page: number) {
    const p = new URLSearchParams();
    if (query.q) p.set("q", query.q);
    if (query.status !== "ALL") p.set("status", query.status);
    if (query.category) p.set("category", query.category);
    if (query.brand) p.set("brand", query.brand);
    if (query.seller) p.set("seller", query.seller);
    if (query.featured !== "ALL") p.set("featured", query.featured);
    if (query.sort !== "newest") p.set("sort", query.sort);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    return qs ? `/admin/machines?${qs}` : "/admin/machines";
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rn-eyebrow">Listings</p>
          <h1 className="rn-page-title">Machine Management</h1>
        </div>
        <Link href="/admin/approvals" className="rn-btn-primary h-10 px-4 text-sm">
          Approval Queue
        </Link>
      </header>

      <form className="rn-panel grid gap-3 sm:grid-cols-2 xl:grid-cols-7" action="/admin/machines" method="GET">
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Search title, location, seller"
          className="h-10 rounded-lg border border-black/10 px-3 text-sm sm:col-span-2"
        />
        <select name="status" defaultValue={query.status} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="ALL">All statuses</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="DRAFT">Draft</option>
          <option value="REJECTED">Rejected</option>
          <option value="PUBLISHED">Published</option>
          <option value="SOLD">Sold</option>
          <option value="ARCHIVED">Archived</option>
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
        <select name="featured" defaultValue={query.featured} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="ALL">All featured</option>
          <option value="YES">Featured</option>
          <option value="NO">Not featured</option>
        </select>
        <select name="sort" defaultValue={query.sort} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_desc">Price high to low</option>
          <option value="price_asc">Price low to high</option>
        </select>
        <button type="submit" className="rn-btn-primary h-10 sm:col-span-2 xl:col-span-7">
          Apply Filters
        </button>
      </form>

      {machines.length === 0 ? (
        <div className="rn-panel text-center text-sm text-rn-muted">No machine listings found.</div>
      ) : (
        <div className="rn-panel overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-rn-muted">
                <th className="px-4 py-3">Machine</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id} className="border-b border-black/5 align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 overflow-hidden rounded-lg bg-rn-surface">
                        {machine.images[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveMachineImageUrl(machine.images[0].url) ?? machine.images[0].url}
                            alt={machine.images[0].alt || machine.title}
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <Link
                          href={`/admin/machines/${machine.id}`}
                          className="font-medium text-rn-ink hover:underline"
                        >
                          {machine.title}
                        </Link>
                        <p className="text-xs text-rn-muted">{machine.location || "—"}</p>
                        {machine.isFeatured ? (
                          <span className="mt-1 inline-block rounded-full bg-rn-gold/20 px-2 py-0.5 text-[10px] font-semibold text-rn-ink">
                            Featured
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-rn-muted">{machine.seller.name || machine.seller.email}</td>
                  <td className="px-4 py-3">{machine.category.name}</td>
                  <td className="px-4 py-3">{machine.brand.name}</td>
                  <td className="px-4 py-3">{formatPrice(machine.price)}</td>
                  <td className="px-4 py-3">
                    <MachineStatusBadge status={machine.status} />
                  </td>
                  <td className="px-4 py-3 text-rn-muted">
                    {machine.submittedForReviewAt
                      ? new Date(machine.submittedForReviewAt).toLocaleDateString()
                      : new Date(machine.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <AdminListingModerationActions
                      machineId={machine.id}
                      machineTitle={machine.title}
                      status={machine.status}
                      isFeatured={machine.isFeatured}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
