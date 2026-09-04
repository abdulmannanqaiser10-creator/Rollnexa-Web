import type { Metadata } from "next";
import { ComparePageClient } from "@/components/compare/compare-page-client";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Compare Machines",
  description:
    "Compare heavy construction equipment side by side — price, year, hours, condition, and more.",
  path: "/compare",
  keywords: ["compare excavators", "compare heavy equipment"],
});

export default function ComparePage() {
  return <ComparePageClient />;
}
