import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

type PremiumBadgeProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

export function PremiumBadge({
  label = "Premium Seller",
  className,
  size = "sm",
}: PremiumBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#F5B800]/15 font-semibold text-[#B8860B]",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Crown className={size === "sm" ? "size-3" : "size-3.5"} />
      {label}
    </span>
  );
}
