import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureDefaultPlans } from "@/lib/subscriptions/plans";

export const metadata = { title: "Subscription Plans — Rollnexa Admin" };

export default async function AdminSubscriptionsPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login?callbackUrl=/admin/subscriptions");

  await ensureDefaultPlans();
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="rn-eyebrow">Billing</p>
        <h1 className="rn-page-title">Subscription Plans</h1>
        <p className="mt-2 text-sm text-rn-muted">
          Manage seller subscription tiers, pricing, and feature limits.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article key={plan.id} className="rn-panel">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-rn-ink">{plan.name}</h2>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${plan.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
                {plan.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-2 text-sm text-rn-muted">{plan.description}</p>
            <p className="mt-4 text-2xl font-bold text-rn-ink">
              {plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-rn-muted">
              <li>Listings: {plan.maxListings ?? "Unlimited"}</li>
              <li>Featured: {plan.featuredListings}</li>
              <li>Promotion credits: {plan.promotionCredits}</li>
              <li>Premium badge: {plan.premiumBadge ? "Yes" : "No"}</li>
              <li>Analytics: {plan.analytics ? "Yes" : "No"}</li>
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
