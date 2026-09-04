import { Star } from "lucide-react";
import type { ReviewSummary as Summary } from "@/lib/reviews/query";

type ReviewSummaryProps = {
  summary: Summary;
};

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <h3 className="font-display text-lg font-bold text-[#111827]">Ratings & Reviews</h3>
      {summary.total === 0 ? (
        <p className="mt-2 text-sm text-[#6B7280]">No reviews yet. Be the first buyer to review this machine.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <p className="font-display text-4xl font-bold text-[#111827]">{summary.average.toFixed(1)}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-[#6B7280]">
              <Star className="size-4 fill-rn-gold text-rn-gold" />
              Based on {summary.total} review{summary.total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="space-y-2">
            {summary.distribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-2 text-xs text-[#4B5563]">
                <span className="w-10">{row.stars} star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full bg-rn-gold" style={{ width: `${row.percent}%` }} />
                </div>
                <span className="w-12 text-right">{row.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
