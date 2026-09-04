import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  getMachineBySlug,
  getRelatedMachines,
} from "@/lib/machines/detail";
import { MachineGallery } from "@/components/machines/machine-gallery";
import { MachineSummary } from "@/components/machines/machine-summary";
import {
  MachineDescription,
  MachineSpecifications,
} from "@/components/machines/machine-description";
import { SellerCard } from "@/components/machines/seller-card";
import { RelatedMachines } from "@/components/machines/related-machines";
import { TrackRecentlyViewed } from "@/components/recently-viewed/track-recently-viewed";
import { getMachineReviewBundle } from "@/lib/reviews/query";
import { MachineReviewsSection } from "@/components/reviews/machine-reviews-section";
import { buildBreadcrumbSchema, buildMetadata, buildProductSchema, buildWebPageSchema } from "@/lib/seo";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const machine = await getMachineBySlug(slug);

  if (!machine) {
    return {
      title: "Machine Not Found | Rollnexa",
    };
  }

  const descriptionParts = [
    machine.brand.name,
    machine.model,
    machine.year ? String(machine.year) : null,
    machine.conditionLabel,
    machine.location,
  ].filter(Boolean);

  return buildMetadata({
    title: machine.title,
    description:
      machine.description?.slice(0, 155) ||
      `${descriptionParts.join(" · ")} — available on Rollnexa.`,
    path: `/machines/${machine.slug}`,
    image: machine.images[0]?.url,
    keywords: [machine.brand.name, machine.category.name, machine.model || machine.title],
  });
}

export default async function MachineDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  let machine: Awaited<ReturnType<typeof getMachineBySlug>> = null;
  let loadFailed = false;

  try {
    machine = await getMachineBySlug(slug, session?.user?.id);
  } catch (error) {
    console.error("[machines/slug] Failed to load machine:", error);
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <div className="bg-rn-surface py-14">
        <div className="rn-container">
          <div className="rn-card mx-auto max-w-lg p-10 text-center">
            <h1 className="font-display text-2xl font-bold text-rn-ink">
              Unable to load machine
            </h1>
            <p className="mt-2 text-sm text-rn-muted">
              Please try again in a moment.
            </p>
            <Link
              href="/machines"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!machine) notFound();

  let related: Awaited<ReturnType<typeof getRelatedMachines>> = [];
  let reviewsBundle = {
    summary: { average: 0, total: 0, distribution: [] as Array<{ stars: 1 | 2 | 3 | 4 | 5; count: number; percent: number }> },
    reviews: [] as Awaited<ReturnType<typeof getMachineReviewBundle>>["reviews"],
    userReview: null as Awaited<ReturnType<typeof getMachineReviewBundle>>["userReview"],
    canReview: false,
  };
  try {
    related = await getRelatedMachines({
      machineId: machine.id,
      categoryId: machine.category.id,
      brandId: machine.brand.id,
    });
  } catch (error) {
    console.error("[machines/slug] Related machines failed:", error);
  }

  try {
    reviewsBundle = await getMachineReviewBundle({
      machineId: machine.id,
      userId: session?.user?.id,
      role: session?.user?.role,
    });
  } catch (error) {
    console.error("[machines/slug] Reviews failed:", error);
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Machines", path: "/machines" },
    { name: machine.category.name, path: `/categories/${machine.category.slug}` },
    { name: machine.title, path: `/machines/${machine.slug}` },
  ]);

  const productSchema = buildProductSchema({
    title: machine.title,
    slug: machine.slug,
    description: machine.description,
    price: machine.price,
    priceLabel: machine.priceLabel,
    brand: machine.brand,
    category: machine.category,
    location: machine.location,
    year: machine.year,
    hours: machine.hours,
    conditionLabel: machine.conditionLabel,
    images: machine.images,
    seller: machine.seller,
    aggregateRating:
      reviewsBundle.summary.total > 0
        ? {
            ratingValue: reviewsBundle.summary.average,
            reviewCount: reviewsBundle.summary.total,
          }
        : null,
  });

  return (
    <div className="bg-rn-surface py-8 sm:py-12">
      <SeoJsonLd data={breadcrumbSchema} />
      <SeoJsonLd data={productSchema} />
      <SeoJsonLd data={buildWebPageSchema(`/machines/${machine.slug}`, machine.title, machine.description || `${machine.title} available on Rollnexa.`)} />
      <TrackRecentlyViewed
        machineId={machine.id}
        enabled={Boolean(session?.user?.id)}
      />
      <div className="rn-container space-y-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-rn-muted">
          <Link href="/" className="hover:text-rn-ink">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/machines" className="hover:text-rn-ink">
            Machines
          </Link>
          <ChevronRight className="size-3.5" />
          <Link
            href={`/categories/${machine.category.slug}`}
            className="hover:text-rn-ink"
          >
            {machine.category.name}
          </Link>
          <ChevronRight className="size-3.5" />
          <Link
            href={`/brands/${machine.brand.slug}`}
            className="hover:text-rn-ink"
          >
            {machine.brand.name}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1 font-medium text-rn-ink">{machine.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <MachineGallery title={machine.title} images={machine.images} />
          <MachineSummary
            machine={machine}
            isAuthenticated={Boolean(session?.user)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MachineDescription description={machine.description} />
          <MachineSpecifications machine={machine} />
        </div>

        <SellerCard seller={machine.seller} />
        <MachineReviewsSection
          machineId={machine.id}
          summary={reviewsBundle.summary}
          reviews={reviewsBundle.reviews}
          canReview={reviewsBundle.canReview}
          userReview={
            reviewsBundle.userReview
              ? {
                  id: reviewsBundle.userReview.id,
                  rating: reviewsBundle.userReview.rating,
                  content: reviewsBundle.userReview.content,
                }
              : null
          }
        />

        <RelatedMachines machines={related} />
      </div>
    </div>
  );
}
