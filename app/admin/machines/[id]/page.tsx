import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getAdminMachineReview } from "@/lib/admin/listings-query";
import { parseListingDescription } from "@/lib/machines/detail";
import { AdminListingModerationActions } from "@/components/admin/AdminListingModerationActions";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Review Listing — Rollnexa Admin" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminMachineReviewPage({ params }: PageProps) {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const { id } = await params;
  const machine = await getAdminMachineReview(id);
  if (!machine) notFound();

  const { model } = parseListingDescription(machine.description);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/admin/approvals" className="text-sm text-rn-muted hover:text-rn-ink">
            ← Back to approval queue
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="rn-page-title">{machine.title}</h1>
            <MachineStatusBadge status={machine.status} />
            {machine.isFeatured ? (
              <span className="rounded-full bg-rn-gold/20 px-2.5 py-1 text-[11px] font-semibold uppercase">
                Featured
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-rn-muted">
            Submitted{" "}
            {machine.submittedForReviewAt
              ? new Date(machine.submittedForReviewAt).toLocaleString()
              : "—"}
          </p>
        </div>
        <AdminListingModerationActions
          machineId={machine.id}
          machineTitle={machine.title}
          status={machine.status}
          isFeatured={machine.isFeatured}
        />
      </header>

      {machine.rejectionReason ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <p className="font-semibold">Previous rejection</p>
          <p className="mt-1">{machine.rejectionReason}</p>
          {machine.rejectedAt ? (
            <p className="mt-1 text-xs text-rose-800/80">
              {new Date(machine.rejectedAt).toLocaleString()}
              {machine.rejectedBy
                ? ` · ${machine.rejectedBy.name || machine.rejectedBy.email}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rn-panel space-y-4">
          <h2 className="font-display text-lg font-bold text-rn-ink">Listing Details</h2>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Price</dt>
              <dd className="mt-1 font-semibold text-rn-ink">{formatPrice(machine.price)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Location</dt>
              <dd className="mt-1 text-rn-ink">{machine.location || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Category</dt>
              <dd className="mt-1 text-rn-ink">{machine.category.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Brand</dt>
              <dd className="mt-1 text-rn-ink">{machine.brand.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Model</dt>
              <dd className="mt-1 text-rn-ink">{model || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Year</dt>
              <dd className="mt-1 text-rn-ink">{machine.year ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Hours</dt>
              <dd className="mt-1 text-rn-ink">{machine.hours?.toLocaleString() ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-rn-muted">Condition</dt>
              <dd className="mt-1 text-rn-ink">{machine.condition}</dd>
            </div>
          </dl>
          {machine.description ? (
            <div className="border-t border-black/5 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-rn-muted">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-rn-ink">{machine.description}</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rn-panel space-y-3">
            <h2 className="font-display text-lg font-bold text-rn-ink">Seller</h2>
            <p className="text-sm font-medium text-rn-ink">
              {machine.seller.name || machine.seller.email}
            </p>
            <p className="text-sm text-rn-muted">{machine.seller.email}</p>
            <p className="text-sm text-rn-muted">
              Status: {machine.seller.accountStatus}
            </p>
            {machine.seller.profile?.companyName ? (
              <p className="text-sm text-rn-muted">{machine.seller.profile.companyName}</p>
            ) : null}
            <Link href={`/admin/users?q=${encodeURIComponent(machine.seller.email)}`} className="text-sm text-rn-gold hover:underline">
              View user profile
            </Link>
          </section>

          <section className="rn-panel space-y-3">
            <h2 className="font-display text-lg font-bold text-rn-ink">Images</h2>
            {machine.images.length === 0 ? (
              <p className="text-sm text-rn-muted">No images uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {machine.images.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="overflow-hidden rounded-xl bg-rn-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.alt || `${machine.title} image ${index + 1}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
