"use client";

import { useState } from "react";
import { GitCompareArrows } from "lucide-react";
import {
  useCompareStore,
  type CompareMachine,
} from "@/lib/stores/compare-store";
import { cn } from "@/lib/utils";

type CompareButtonProps = {
  machine: CompareMachine;
  variant?: "button" | "icon";
  className?: string;
};

export function CompareButton({
  machine,
  variant = "button",
  className,
}: CompareButtonProps) {
  const items = useCompareStore((state) => state.items);
  const toggle = useCompareStore((state) => state.toggle);
  const inCompare = items.some((item) => item.id === machine.id);
  const [feedback, setFeedback] = useState<string | null>(null);

  function onToggle() {
    const result = toggle(machine);
    setFeedback(result.message);
    window.setTimeout(() => setFeedback(null), 2500);
  }

  if (variant === "icon") {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={inCompare ? "Remove from compare" : "Add to compare"}
          aria-pressed={inCompare}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-rn-ink shadow-sm transition hover:bg-rn-gold",
            inCompare && "bg-rn-ink text-white hover:bg-rn-ink"
          )}
        >
          <GitCompareArrows className="size-4" />
        </button>
        {feedback ? (
          <span className="absolute top-full right-0 z-10 mt-1 whitespace-nowrap rounded bg-rn-ink px-2 py-1 text-[10px] font-medium text-white">
            {feedback}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={inCompare ? "Remove from compare" : "Add to compare"}
        aria-pressed={inCompare}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition",
          inCompare
            ? "border-rn-ink bg-rn-ink text-white"
            : "border-rn-ink/10 bg-white text-rn-ink hover:border-rn-gold"
        )}
      >
        <GitCompareArrows className="size-4" />
        {inCompare ? "In Compare" : "Compare"}
      </button>
      {feedback ? (
        <p
          className={cn(
            "text-xs font-medium",
            feedback.includes("up to") ? "text-amber-700" : "text-rn-ink"
          )}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
