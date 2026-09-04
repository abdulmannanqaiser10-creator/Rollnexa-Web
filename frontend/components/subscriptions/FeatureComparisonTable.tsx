import type { PricingPlan } from "./PricingCards";

type FeatureComparisonTableProps = {
  plans: PricingPlan[];
};

const rows = [
  { key: "maxListings", label: "Machine listings", render: (p: PricingPlan) => (p.maxListings == null ? "Unlimited" : p.maxListings) },
  { key: "featuredListings", label: "Featured listings", render: (p: PricingPlan) => (p.featuredListings >= 999 ? "Unlimited" : p.featuredListings) },
  { key: "homepageFeatured", label: "Homepage featured", render: (p: PricingPlan) => (p.homepageFeatured ? "Yes" : "—") },
  { key: "premiumBadge", label: "Premium badge", render: (p: PricingPlan) => (p.premiumBadge ? "Yes" : "—") },
  { key: "analytics", label: "Advanced analytics", render: (p: PricingPlan) => (p.analytics ? "Yes" : "—") },
  { key: "prioritySupport", label: "Priority support", render: (p: PricingPlan) => (p.prioritySupport ? "Yes" : "—") },
  { key: "dealerProfile", label: "Dealer profile", render: (p: PricingPlan) => (p.dealerProfile ? "Yes" : "—") },
] as const;

export function FeatureComparisonTable({ plans }: FeatureComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-[#F9FAFB] text-left">
            <th className="px-4 py-3 font-semibold text-[#111827]">Feature</th>
            {plans.map((plan) => (
              <th key={plan.id} className="px-4 py-3 font-semibold text-[#111827]">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-black/5">
              <td className="px-4 py-3 font-medium text-[#374151]">{row.label}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-[#6B7280]">
                  {row.render(plan)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
