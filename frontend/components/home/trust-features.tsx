import {
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
  },
  {
    icon: Wallet,
    title: "Best Price Guarantee",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
  },
];

export function TrustFeatures() {
  return (
    <section className="bg-rn-navy text-white">
      <div className="rn-container grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:py-6">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-rn-gold/15 text-rn-gold">
              <feature.icon className="size-5" />
            </span>
            <p className="text-sm font-semibold tracking-wide sm:text-base">
              {feature.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
