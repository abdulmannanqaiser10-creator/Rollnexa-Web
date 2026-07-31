import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  accent?: "gold" | "ink" | "emerald" | "sky" | "rose";
};

const accentMap = {
  gold: "bg-[#F5B800]/15 text-[#B8860B]",
  ink: "bg-[#080D12] text-[#F5B800]",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
};

export function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "gold",
}: AdminStatCardProps) {
  return (
    <div className="rn-stat-card">
      <span className={cn("rn-stat-icon", accentMap[accent])}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-display text-2xl font-bold text-rn-ink">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-sm text-rn-muted">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-rn-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
