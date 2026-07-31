import { HeroSection } from "@/components/home/hero-section";
import { PopularCategories } from "@/components/home/popular-categories";
import { FeaturedMachines } from "@/components/home/featured-machines";
import { LatestListings } from "@/components/home/latest-listings";
import { PopularBrands } from "@/components/home/popular-brands";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta-section";
import { getHomePageData } from "@/lib/home-data";

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
