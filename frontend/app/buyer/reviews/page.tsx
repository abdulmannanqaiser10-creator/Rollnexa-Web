import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getBuyerReviews } from "@/lib/reviews/query";

export const metadata = {
  title: "My Reviews — Rollnexa Buyer",
};

export default async function BuyerReviewsPage() {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login?callbackUrl=/buyer/reviews");

  const [reviews, repliedInquiries] = await Promise.all([
    getBuyerReviews(session.user.id).catch(() => []),
    prisma.inquiry
      .findMany({
        where: { buyerId: session.user.id, status: "REPLIED" },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          updatedAt: true,
          machineId: true,
          machine: {
            select: {
              title: true,
              slug: true,
              brand: { select: { name: true } },
            },
          },
          seller: {
            select: {
              name: true,
              profile: { select: { companyName: true } },
            },
          },
        },
      })
      .catch(() => []),
  ]);

  const reviewedMachineIds = new Set(reviews.map((review) => review.machine.id));
  const opportunities = repliedInquiries.filter(
    (item) => !reviewedMachineIds.has(item.machineId)
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Buyer Reviews</p>
        <h1 className="rn-page-title text-2xl sm:text-3xl">My Reviews</h1>
        <p className="mt-2 text-sm text-rn-muted">
          Share your machine and seller experience from your completed interactions.
        </p>
      </header>

      {reviews.length === 0 ? (
        <div className="rn-panel text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-rn-ink/5">
            <Star className="size-6 text-rn-muted" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-rn-ink">
            You haven&apos;t submitted any reviews yet.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-rn-muted">
            No reviews yet. Be the first buyer to review this machine.
          </p>
          <Link href="/machines" className="rn-btn-primary mt-5">
            Browse Machines
          </Link>
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div className="rn-panel">
          <h2 className="font-display text-lg font-bold text-rn-ink">Submitted Reviews</h2>
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-black/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-rn-ink">{review.machine.title}</p>
                  <div className="flex items-center gap-1 text-rn-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-3.5 ${review.rating >= star ? "fill-current" : ""}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-rn-muted">
                  {review.machine.brand.name} · Seller:{" "}
                  {review.seller.profile?.companyName || review.seller.name || "Seller"}
                </p>
                <p className="mt-2 text-sm text-rn-muted">{review.content}</p>
                {review.sellerReply ? (
                  <div className="mt-3 rounded-lg border border-rn-gold/25 bg-rn-gold/10 px-3 py-2 text-sm text-rn-ink">
                    <p className="text-[11px] font-semibold tracking-wide uppercase">Seller Reply</p>
                    <p className="mt-0.5">{review.sellerReply}</p>
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-rn-muted">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {opportunities.length > 0 ? (
        <div className="rn-panel">
          <h2 className="font-display text-lg font-bold text-rn-ink">
            Review Opportunities
          </h2>
          <ul className="mt-4 space-y-3">
            {opportunities.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-black/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-rn-ink">
                    {item.machine.title}
                  </p>
                  <p className="text-xs text-rn-muted">
                    {item.machine.brand.name} · Seller:{" "}
                    {item.seller.profile?.companyName || item.seller.name || "Seller"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-rn-muted">
                    Replied{" "}
                    {new Date(item.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/machines/${item.machine.slug}`}
                    className="text-xs font-semibold text-rn-gold underline-offset-4 hover:underline"
                  >
                    View Machine →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
