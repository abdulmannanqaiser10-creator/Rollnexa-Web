"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
};

export function StarRatingInput({
  value,
  onChange,
  disabled,
  id = "review-rating",
}: StarRatingInputProps) {
  return (
    <div>
      <p id={`${id}-label`} className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
        Rating
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-label="Select a rating from 1 to 5 stars."
        className="mt-2 flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = value >= star;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                  event.preventDefault();
                  onChange(Math.min(5, value + 1));
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                  event.preventDefault();
                  onChange(Math.max(1, value - 1));
                }
              }}
              className={cn(
                "rounded-md p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rn-gold/50 disabled:opacity-50",
                selected ? "text-rn-gold" : "text-[#9CA3AF] hover:text-rn-gold"
              )}
            >
              <Star className={cn("size-6", selected && "fill-current")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
