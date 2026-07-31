import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getSellerDashboardData } from "@/lib/seller/dashboard-data";
import { WelcomeBanner } from "@/components/seller/WelcomeBanner";
import { SellerStats } from "@/components/seller/SellerStats";
import { QuickActions } from "@/components/seller/QuickActions";
import { MyMachinesPreview } from "@/components/seller/MyMachinesPreview";
import { RecentInquiries } from "@/components/seller/RecentInquiries";
import { RecentActivity } from "@/components/seller/RecentActivity";
import { SubscriptionOverview } from "@/components/subscriptions/SubscriptionOverview";
import { getSellerSubscriptionView } from "@/lib/subscriptions/service";

export const metadata = {
  title: "Seller Dashboard — Rollnexa",
};

export default async function SellerDashboardPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  let data: Awaited<ReturnType<typeof getSellerDashboardData>>;
  let subscription: Awaited<ReturnType<typeof getSellerSubscriptionView>>;

  try {
    [data, subscription] = await Promise.all([
      getSellerDashboardData(session.user.id),
      getSellerSubscriptionView(session.user.id),
    ]);
  } catch (error) {
    console.error("[seller/dashboard] Failed to load dashboard data:", error);
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-2xl font-bold text-[#111827]">
          Unable to load dashboard data.
        </h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Please try again in a moment.
        </p>
        <Link
          href="/seller/dashboard"
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12]"
        >
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WelcomeBanner sellerName={data.sellerName} />
      <SubscriptionOverview subscription={subscription} />
      <SellerStats stats={data.stats} />
      <QuickActions />
      <MyMachinesPreview machines={data.machines} />
      <div className="grid gap-6 xl:grid-cols-2">
        <RecentInquiries inquiries={data.inquiries} />
        <RecentActivity activity={data.activity} />
      </div>
    </div>
  );
}
