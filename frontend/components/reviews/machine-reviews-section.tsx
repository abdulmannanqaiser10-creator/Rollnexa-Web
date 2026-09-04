import type { ReviewItem, ReviewSummary } from "@/lib/reviews/query";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewSummary as RatingSummary } from "@/components/reviews/review-summary";

type MachineReviewsSectionProps = {
  machineId: string;
  summary: ReviewSummary;
  reviews: ReviewItem[];
  canReview: boolean;
  userReview: { id: string; rating: number; content: string } | null;
};

export function MachineReviewsSection({
  machineId,
  summary,
  reviews,
  canReview,
  userReview,
}: MachineReviewsSectionProps) {
  return (
    <section className="space-y-4" id="reviews">
      <RatingSummary summary={summary} />
      <ReviewForm machineId={machineId} userReview={userReview} canReview={canReview} />
      <ReviewList reviews={reviews} />
    </section>
  );
}
