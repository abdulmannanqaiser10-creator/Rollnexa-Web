import Link from "next/link";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View All",
  className,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className
      )}
    >
      <div className={cn(align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="rn-section-title">{title}</h2>
        {description ? <p className="rn-section-subtitle">{description}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-rn-ink/10 bg-white px-4 py-2 text-sm font-semibold text-rn-ink transition hover:border-rn-gold hover:text-rn-ink"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
