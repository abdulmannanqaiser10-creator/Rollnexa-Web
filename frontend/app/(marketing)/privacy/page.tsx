import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Review how Rollnexa handles your data and privacy preferences.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="bg-rn-surface py-14">
      <div className="rn-container max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-rn-ink">Privacy Policy</h1>
        <p className="mt-5 text-sm leading-relaxed text-rn-muted">
          Rollnexa protects account data and uses it only to operate the marketplace,
          improve trust and safety, and communicate important service updates.
        </p>
      </div>
    </div>
  );
}
