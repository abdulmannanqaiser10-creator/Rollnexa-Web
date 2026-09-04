import Link from "next/link";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon = Package,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-black/10 bg-[#F6F7F9] px-6 py-10 text-center",
        className
      )}
    >
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-white text-[#F5B800] shadow-sm">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-[#111827]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#F5B800] px-4 text-sm font-bold text-[#080D12]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
