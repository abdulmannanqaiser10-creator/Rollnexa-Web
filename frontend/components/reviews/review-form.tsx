"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { reviewCreateClientSchema } from "@/lib/validations/review";
import { StarRatingInput } from "@/components/reviews/star-rating-input";

type ReviewFormInput = z.infer<typeof reviewCreateClientSchema>;

type ReviewFormProps = {
  machineId: string;
  userReview?: { id: string; rating: number; content: string } | null;
  canReview: boolean;
};

export function ReviewForm({ machineId, userReview, canReview }: ReviewFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(userReview?.rating || 0);

  const { register, setValue, handleSubmit, formState } = useForm<ReviewFormInput>({
    resolver: zodResolver(reviewCreateClientSchema),
    defaultValues: {
      machineId,
      rating: userReview?.rating || 0,
      content: userReview?.content || "",
    },
  });

  async function onSubmit(values: ReviewFormInput) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const endpoint = userReview ? `/api/reviews/${userReview.id}` : "/api/reviews";
      const method = userReview ? "PATCH" : "POST";
      const body = userReview
        ? { rating: values.rating, content: values.content }
        : values;
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Unable to submit review.");
        return;
      }
      setSuccess(userReview ? "Review updated." : "Review submitted.");
    } catch (e) {
      console.error("[reviews/form] submit failed:", e);
      setError("Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canReview && !userReview) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-4 text-sm text-[#6B7280]">
        You can review this machine after interacting with the seller.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-black/5 bg-white p-5">
      <h3 className="font-display text-lg font-bold text-[#111827]">
        {userReview ? "Edit your review" : "Write a review"}
      </h3>
      <input type="hidden" {...register("machineId")} />
      <StarRatingInput
        value={rating}
        onChange={(value) => {
          setRating(value);
          setValue("rating", value, { shouldValidate: true });
        }}
        disabled={submitting}
      />
      {formState.errors.rating ? (
        <p className="text-xs text-red-600">{formState.errors.rating.message}</p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">Review</span>
        <textarea
          {...register("content")}
          rows={4}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#F5B800]"
          placeholder="Share your experience with this machine and seller."
          disabled={submitting}
        />
      </label>
      {formState.errors.content ? (
        <p className="text-xs text-red-600">{formState.errors.content.message}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rn-btn-primary disabled:opacity-60"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
      </button>
    </form>
  );
}
