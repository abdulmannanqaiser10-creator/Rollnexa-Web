import { Star } from "lucide-react";
import type { ReviewItem } from "@/lib/reviews/query";

type ReviewListProps = {
  reviews: ReviewItem[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-[#6B7280]">
        No reviews yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-2xl border border-black/5 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#111827]">{review.reviewer.name}</p>
              <p className="mt-1 text-xs text-[#6B7280]">{formatDate(review.createdAt)}</p>
            </div>
            <div className="flex items-center gap-0.5 text-rn-gold">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-4 ${review.rating >= star ? "fill-current" : ""}`}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#374151]">{review.content}</p>
          {review.sellerReply ? (
            <div className="mt-4 rounded-xl border border-rn-gold/30 bg-rn-gold/10 p-3">
              <p className="text-xs font-semibold tracking-wide text-[#7A5A00] uppercase">
                Seller reply
              </p>
              <p className="mt-1 text-sm text-[#374151]">{review.sellerReply}</p>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
