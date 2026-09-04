import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accent?: "gold" | "ink" | "emerald" | "sky";
};

const accentMap = {
  gold: "bg-[#F5B800]/15 text-[#B8860B]",
  ink: "bg-[#080D12] text-[#F5B800]",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "gold",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(8,13,18,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(8,13,18,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
            {title}
          </p>
          <p className="mt-3 font-display text-3xl font-bold text-[#111827]">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-xl",
            accentMap[accent]
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-[#6B7280]">{description}</p>
    </div>
  );
}
