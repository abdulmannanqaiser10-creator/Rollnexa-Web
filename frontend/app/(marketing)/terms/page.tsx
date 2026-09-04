import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description: "Review the terms of use for buying and selling on Rollnexa.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="bg-rn-surface py-14">
      <div className="rn-container max-w-3xl prose prose-neutral">
        <h1 className="font-display text-4xl font-bold text-rn-ink">
          Terms &amp; Conditions
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-rn-muted">
          By using Rollnexa you agree to our marketplace rules for listings,
          communications, and transactions. This page will be expanded with full
          legal terms as the platform grows.
        </p>
      </div>
    </div>
  );
}
