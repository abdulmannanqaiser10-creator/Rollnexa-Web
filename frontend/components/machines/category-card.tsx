import Link from "next/link";
import Image from "next/image";
import type { CatalogCategory } from "@/lib/catalog/query";

type CategoryCardProps = {
  category: CatalogCategory | {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    machineCount: number;
    imageUrl?: string;
  };
};

export function CategoryCard({ category }: CategoryCardProps) {
  const imageUrl =
    "imageUrl" in category && category.imageUrl
      ? category.imageUrl
      : undefined;

  return (
    <Link
      href={`/categories/${encodeURIComponent(category.slug)}`}
      className="rn-card group relative block overflow-hidden"
    >
      <div className="relative aspect-[5/4] bg-rn-surface">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-rn-ink via-rn-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-lg font-bold text-white">
            {category.name}
          </h3>
          <p className="mt-1 text-xs text-white/75">
            {category.machineCount} listing
            {category.machineCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}
