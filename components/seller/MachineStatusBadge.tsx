import { cn } from "@/lib/utils";
import { LISTING_STATUS_LABELS } from "@/lib/machines/listing-status";

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  DRAFT: "bg-amber-100 text-amber-800",
  PENDING_REVIEW: "bg-violet-100 text-violet-800",
  REJECTED: "bg-rose-100 text-rose-800",
  SOLD: "bg-sky-100 text-sky-800",
  ARCHIVED: "bg-gray-100 text-gray-700",
  PENDING: "bg-violet-100 text-violet-800",
  NEW: "bg-amber-100 text-amber-800",
  READ: "bg-sky-100 text-sky-800",
  REPLIED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-gray-100 text-gray-700",
};

type MachineStatusBadgeProps = {
  status: string;
  className?: string;
};

export function MachineStatusBadge({ status, className }: MachineStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        statusStyles[status] || "bg-gray-100 text-gray-700",
        className
      )}
    >
      {LISTING_STATUS_LABELS[status as keyof typeof LISTING_STATUS_LABELS] || status.replaceAll("_", " ")}
    </span>
  );
}
