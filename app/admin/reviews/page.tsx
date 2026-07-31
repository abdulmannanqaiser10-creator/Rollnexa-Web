import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { adminReviewsQuerySchema } from "@/lib/validations/admin";
import { AdminReviewModerationControls } from "@/components/reviews/admin-review-moderation-controls";

export const metadata = { title: "Review Moderation — Rollnexa Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const params = await searchParams;
  const query = adminReviewsQuerySchema.parse({
    q: first(params.q),
    status: first(params.status),
    rating: first(params.rating),
    page: first(params.page),
    pageSize: first(params.pageSize),
  });

  const where = {
    ...(query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.rating ? { rating: query.rating } : {}),
    ...(query.q
      ? {
          OR: [
            { content: { contains: query.q, mode: "insensitive" as const } },
            { machine: { title: { contains: query.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        rating: true,
        content: true,
        status: true,
        moderationNote: true,
        createdAt: true,
        reviewer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        machine: { select: { title: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Safety & Trust</p>
        <h1 className="rn-page-title">Review Moderation</h1>
      </header>

      <form className="rn-panel grid gap-3 sm:grid-cols-2 xl:grid-cols-5" action="/admin/reviews" method="GET">
        <input name="q" defaultValue={query.q} placeholder="Search review or machine" className="h-10 rounded-lg border border-black/10 px-3 text-sm sm:col-span-2" />
        <select name="status" defaultValue={query.status} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="ALL">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="HIDDEN">Hidden</option>
          <option value="REMOVED">Removed</option>
        </select>
        <select name="rating" defaultValue={query.rating?.toString()} className="h-10 rounded-lg border border-black/10 px-3 text-sm">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>{rating} stars</option>
          ))}
        </select>
        <button type="submit" className="rn-btn-primary h-10">Apply</button>
      </form>

      {reviews.length === 0 ? (
        <div className="rn-panel text-center text-sm text-rn-muted">No reviews found.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rn-panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-rn-ink">{review.machine.title}</p>
                <span className="rounded-full bg-black/5 px-2 py-1 text-[11px] font-semibold text-rn-muted">
                  {review.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-rn-muted">
                Buyer: {review.reviewer.name || review.reviewer.email} · Seller:{" "}
                {review.seller.name || review.seller.email}
              </p>
              <p className="mt-2 text-sm text-rn-ink">{review.content}</p>
              <p className="mt-1 text-xs text-rn-muted">
                Rating: {review.rating}/5 · {new Date(review.createdAt).toLocaleDateString()}
              </p>
              <AdminReviewModerationControls reviewId={review.id} currentStatus={review.status} />
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-rn-muted">
        <p>{total.toLocaleString()} reviews</p>
        <div className="flex gap-2">
          {query.page > 1 ? <Link href={`/admin/reviews?page=${query.page - 1}`} className="rn-btn-secondary h-9 px-3 text-xs">Previous</Link> : null}
          {query.page < totalPages ? <Link href={`/admin/reviews?page=${query.page + 1}`} className="rn-btn-secondary h-9 px-3 text-xs">Next</Link> : null}
        </div>
      </div>
    </div>
  );
}
