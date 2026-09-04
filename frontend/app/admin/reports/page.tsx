import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { adminReportsQuerySchema } from "@/lib/validations/admin";
import { AdminReportActions } from "@/components/admin/AdminReportActions";

export const metadata = { title: "Reports — Rollnexa Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const params = await searchParams;
  const query = adminReportsQuerySchema.parse({
    status: first(params.status),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });

  const where = query.status !== "ALL" ? { status: query.status } : {};

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        type: true,
        status: true,
        reason: true,
        description: true,
        createdAt: true,
        reporter: { select: { name: true, email: true } },
        reportedUser: { select: { name: true, email: true } },
        machine: { select: { title: true, slug: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Trust & Safety</p>
        <h1 className="rn-page-title">Reports Management</h1>
      </header>

      <form className="rn-panel flex flex-wrap gap-3" action="/admin/reports" method="GET">
        <select name="status" defaultValue={query.status} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button type="submit" className="rn-btn-primary h-10 px-4">Apply</button>
      </form>

      {reports.length === 0 ? (
        <div className="rn-panel text-center text-sm text-rn-muted">No pending reports.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={report.id} className="rn-panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-rn-ink">{report.type.replaceAll("_", " ")}</p>
                <span className="rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold text-rn-muted">
                  {report.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-rn-ink">{report.reason}</p>
              {report.description ? (
                <p className="mt-2 text-sm text-rn-muted">{report.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-rn-muted">
                Reporter: {report.reporter.name || report.reporter.email}
                {report.reportedUser
                  ? ` · Reported user: ${report.reportedUser.name || report.reportedUser.email}`
                  : ""}
                {report.machine ? (
                  <>
                    {" · Machine: "}
                    <Link href={`/machines/${report.machine.slug}`} className="text-rn-gold hover:underline">
                      {report.machine.title}
                    </Link>
                  </>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-rn-muted">
                {new Date(report.createdAt).toLocaleString()}
              </p>
              <AdminReportActions reportId={report.id} currentStatus={report.status} />
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-rn-muted">
        <p>{total.toLocaleString()} reports</p>
        <div className="flex gap-2">
          {query.page > 1 ? <Link href={`/admin/reports?page=${query.page - 1}`} className="rn-btn-secondary h-9 px-3 text-xs">Previous</Link> : null}
          {query.page < totalPages ? <Link href={`/admin/reports?page=${query.page + 1}`} className="rn-btn-secondary h-9 px-3 text-xs">Next</Link> : null}
        </div>
      </div>
    </div>
  );
}
