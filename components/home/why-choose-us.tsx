import {
  BadgeCheck,
  Headphones,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "@/components/home/section-header";

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    description: "All sellers are verified for your safety",
  },
  {
    icon: ShieldCheck,
    title: "Safe Marketplace",
    description: "100% secure platform for buyers & sellers",
  },
  {
    icon: Search,
    title: "Advanced Search",
    description: "Find the right machine faster",
  },
  {
    icon: Sparkles,
    title: "Premium Listings",
    description: "Get more visibility for your machines",
  },
  {
    icon: Lock,
    title: "Secure Communication",
    description: "Direct & secure communication",
  },
  {
    icon: Headphones,
    title: "Fast Support",
    description: "24/7 customer support",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          align="center"
          eyebrow="Why Rollnexa"
          title="Why Choose Rollnexa"
          description="Built for buyers and sellers who expect a premium heavy equipment marketplace experience."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rn-card p-6">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-rn-gold/15 text-rn-gold">
                <feature.icon className="size-6" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-rn-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-rn-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
