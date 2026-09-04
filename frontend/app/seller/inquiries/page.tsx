import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";
import { EmptyState } from "@/components/seller/EmptyState";

export const metadata = { title: "Inquiries — Rollnexa Seller" };

const STATUS_OPTIONS = ["ALL", "NEW", "READ", "REPLIED", "CLOSED"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const PAGE_SIZE = 15;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SellerInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const params = await searchParams;
  const rawStatus = first(params.status)?.toUpperCase() ?? "ALL";
  const status: StatusFilter = (STATUS_OPTIONS as readonly string[]).includes(rawStatus)
    ? (rawStatus as StatusFilter)
    : "ALL";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const where = {
    sellerId: session.user.id,
    ...(status !== "ALL" ? { status } : {}),
  };

  let inquiries: {
    id: string;
    message: string;
    status: string;
    createdAt: Date;
    machine: { title: string; slug: string };
    buyer: {
      name: string | null;
      email: string;
      profile: { avatar: string | null; companyName: string | null } | null;
    };
  }[] = [];
  let total = 0;
  let loadFailed = false;

  try {
    [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          message: true,
          status: true,
          createdAt: true,
          machine: { select: { title: true, slug: true } },
          buyer: {
            select: {
              name: true,
              email: true,
              profile: { select: { avatar: true, companyName: true } },
            },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);
  } catch (error) {
    console.error("[seller/inquiries] Failed:", error);
    loadFailed = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(updates: { status?: string; page?: number }) {
    const p = new URLSearchParams();
    const s = updates.status ?? status;
    if (s !== "ALL") p.set("status", s.toLowerCase());
    const pg = updates.page ?? page;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return qs ? `/seller/inquiries?${qs}` : "/seller/inquiries";
  }

  if (loadFailed) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-[#111827]">
          Unable to load inquiries
        </h2>
        <p className="mt-2 text-sm text-[#6B7280]">Please try again in a moment.</p>
        <Link
          href="/seller/inquiries"
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12]"
        >
          Retry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#111827]">Inquiries</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Buyer messages about your machine listings
          </p>
        </div>
        <p className="text-sm text-[#6B7280]">
          {total} total · Page {page} of {totalPages}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s, page: 1 })}
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
              status === s
                ? "border-[#080D12] bg-[#080D12] text-white"
                : "border-black/10 bg-white text-[#6B7280] hover:border-[#080D12] hover:text-[#111827]"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <EmptyState
            icon={MessageSquare}
            title={
              status === "ALL"
                ? "No inquiries yet."
                : `No ${status.toLowerCase()} inquiries.`
            }
            description="Buyer inquiries will appear here when buyers contact you about your listings."
            actionHref="/machines"
            actionLabel="View Marketplace"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
          <ul className="divide-y divide-black/5">
            {inquiries.map((inquiry) => {
              const displayName =
                inquiry.buyer.profile?.companyName ||
                inquiry.buyer.name ||
                "Buyer";
              return (
                <li key={inquiry.id}>
                  <Link
                    href={`/seller/inquiries/${inquiry.id}`}
                    className="flex items-start gap-4 px-5 py-4 transition hover:bg-[#F6F7F9]"
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#080D12] text-sm font-bold text-[#F5B800]">
                      {inquiry.buyer.profile?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={inquiry.buyer.profile.avatar}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#111827]">{displayName}</p>
                        <MachineStatusBadge status={inquiry.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-[#6B7280]">
                        {inquiry.machine.title} ·{" "}
                        {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm text-[#111827]/80">
                        {inquiry.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-[#F5B800]">
                      View →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          <Link
            href={buildHref({ page: Math.max(1, page - 1) })}
            aria-disabled={page <= 1}
            className={`inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-[#111827] ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:border-[#F5B800]"
            }`}
          >
            Previous
          </Link>
          <span className="text-sm text-[#6B7280]">
            {page} / {totalPages}
          </span>
          <Link
            href={buildHref({ page: Math.min(totalPages, page + 1) })}
            aria-disabled={page >= totalPages}
            className={`inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-[#111827] ${
              page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-[#F5B800]"
            }`}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
