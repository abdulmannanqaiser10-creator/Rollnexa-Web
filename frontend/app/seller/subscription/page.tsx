import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getActivePlans } from "@/lib/subscriptions/plans";
import { getSellerSubscriptionView } from "@/lib/subscriptions/service";
import { SubscriptionOverview } from "@/components/subscriptions/SubscriptionOverview";
import { PricingCards } from "@/components/subscriptions/PricingCards";
import { FeatureComparisonTable } from "@/components/subscriptions/FeatureComparisonTable";

export const metadata = { title: "Subscription — Rollnexa Seller" };

export default async function SellerSubscriptionPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login?callbackUrl=/seller/subscription");

  const [plans, subscription] = await Promise.all([
    getActivePlans(),
    getSellerSubscriptionView(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280] uppercase">
          Business
        </p>
        <h1 className="font-display text-3xl font-bold text-[#111827]">Subscription Plans</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Upgrade your seller account to unlock premium visibility, featured listings, and advanced tools.
        </p>
      </div>

      <SubscriptionOverview subscription={subscription} />
      <PricingCards plans={plans} currentPlanSlug={subscription.plan.slug} />
      <FeatureComparisonTable plans={plans} />
    </div>
  );
}
