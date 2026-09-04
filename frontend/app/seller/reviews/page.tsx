import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getSellerReviews } from "@/lib/reviews/query";
import { SellerReviewReplyForm } from "@/components/reviews/seller-review-reply-form";

export const metadata = {
  title: "Reviews — Rollnexa Seller",
};

export default async function SellerReviewsPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login?callbackUrl=/seller/reviews");

  const reviews = await getSellerReviews(session.user.id).catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Customer Voice</p>
        <h1 className="rn-page-title">Machine Reviews</h1>
        <p className="mt-2 text-sm text-rn-muted">
          View feedback from buyers and respond professionally.
        </p>
      </header>

      {reviews.length === 0 ? (
        <div className="rn-panel text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-rn-ink/5">
            <Star className="size-5 text-rn-muted" />
          </span>
          <p className="mt-3 text-sm text-rn-muted">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rn-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-rn-ink">{review.machine.title}</p>
                  <p className="text-xs text-rn-muted">
                    Buyer: {review.reviewer.name || "Buyer"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-rn-gold">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`size-4 ${review.rating >= star ? "fill-current" : ""}`} />
                  ))}
                </div>
              </div>

              <p className="mt-3 text-sm text-rn-muted">{review.content}</p>
              <p className="mt-2 text-xs text-rn-muted">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>

              {review.sellerReply ? (
                <div className="mt-3 rounded-lg border border-rn-gold/25 bg-rn-gold/10 px-3 py-2 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rn-ink/70">Your reply</p>
                  <p className="mt-1 text-rn-ink">{review.sellerReply}</p>
                </div>
              ) : review.status === "PUBLISHED" ? (
                <SellerReviewReplyForm reviewId={review.id} />
              ) : null}

              <div className="mt-3">
                <Link href={`/machines/${review.machine.slug}`} className="text-xs font-semibold text-rn-gold hover:underline">
                  View Machine →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
