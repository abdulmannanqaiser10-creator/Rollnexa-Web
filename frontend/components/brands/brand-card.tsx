import Link from "next/link";
import type { CatalogBrand } from "@/lib/catalog/query";

type BrandCardProps = {
  brand: CatalogBrand;
};

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link
      href={`/brands/${encodeURIComponent(brand.slug)}`}
      className="rn-card group flex min-h-36 flex-col items-center justify-center gap-2 px-4 py-6 text-center transition hover:-translate-y-0.5 hover:border-rn-gold/40 hover:shadow-[0_14px_30px_rgba(8,13,18,0.1)]"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-rn-ink font-display text-lg font-bold text-rn-gold">
        {brand.name.charAt(0).toUpperCase()}
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-rn-ink">
        {brand.name}
      </span>
      <span className="text-xs text-rn-muted">
        {brand.machineCount} machine{brand.machineCount === 1 ? "" : "s"}
      </span>
    </Link>
  );
}
