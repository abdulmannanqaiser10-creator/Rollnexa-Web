import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/hero-section";
import { PopularCategories } from "@/components/home/popular-categories";
import { FeaturedMachines } from "@/components/home/featured-machines";
import { LatestListings } from "@/components/home/latest-listings";
import { PopularBrands } from "@/components/home/popular-brands";
import { CtaSection } from "@/components/home/cta-section";
import { getHomePageData } from "@/lib/home-data";
import { buildMetadata, buildWebPageSchema } from "@/lib/seo";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";

export const revalidate = 60;

const HowItWorks = dynamic(
  () =>
    import("@/components/home/how-it-works").then((mod) => ({
      default: mod.HowItWorks,
    })),
  {
    loading: () => (
      <section className="bg-rn-surface py-16" aria-hidden>
        <div className="rn-container h-48 animate-pulse rounded-2xl bg-black/5" />
      </section>
    ),
  }
);

export const metadata: Metadata = buildMetadata({
  title: "Buy & Sell Heavy Machinery",
  description:
    "Discover premium heavy construction equipment listings, trusted dealers, and market insights on Rollnexa.",
  path: "/",
  keywords: ["heavy machinery marketplace", "construction equipment marketplace"],
});

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getHomePageData>>;

  try {
    data = await getHomePageData();
  } catch (error) {
    console.error("[homepage] Failed to load marketplace data:", error);
    data = {
      categories: [],
      brands: [],
      featuredMachines: [],
      recentMachines: [],
      dealers: [],
      stats: {
        machines: 0,
        dealers: 0,
        buyers: 0,
        cities: 0,
        deals: 0,
      },
    };
  }

  return (
    <>
      <SeoJsonLd
        data={buildWebPageSchema(
          "/",
          "Buy & Sell Heavy Machinery | Rollnexa",
          "Discover premium heavy construction equipment listings, trusted dealers, and market insights on Rollnexa."
        )}
      />
      <HeroSection categories={data.categories} brands={data.brands} />
      <PopularCategories categories={data.categories} />
      <FeaturedMachines machines={data.featuredMachines} />
      <LatestListings machines={data.recentMachines} />
      <PopularBrands brands={data.brands} />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
