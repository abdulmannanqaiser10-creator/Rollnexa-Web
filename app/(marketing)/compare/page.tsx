import type { Metadata } from "next";
import { ComparePageClient } from "@/components/compare/compare-page-client";

export const metadata: Metadata = {
  title: "Compare Machines | Rollnexa",
  description:
    "Compare heavy construction equipment side by side — price, year, hours, condition, and more.",
};

export default function ComparePage() {
  return <ComparePageClient />;
}
