import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getAdminAnalyticsData } from "@/lib/admin/dashboard-data";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  Flag,
  Heart,
  MessageSquare,
  Package,
  Star,
  Users,
} from "lucide-react";

export const metadata = { title: "Analytics — Rollnexa Admin" };

export default async function AdminAnalyticsPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const data = await getAdminAnalyticsData().catch(() => null);

  if (!data) {
    return (
      <div className="rn-panel text-sm text-rose-700">
        Unable to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Insights</p>
        <h1 className="rn-page-title">Platform Analytics</h1>
        <p className="mt-2 text-sm text-rn-muted">
          Aggregated marketplace metrics from live database activity.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard title="Total Users" value={data.totalUsers} icon={Users} />
        <AdminStatCard title="New Users (30d)" value={data.newUsers30d} icon={Users} accent="sky" />
        <AdminStatCard title="Buyers" value={data.totalBuyers} icon={Users} accent="emerald" />
        <AdminStatCard title="Sellers" value={data.totalSellers} icon={Users} accent="emerald" />
        <AdminStatCard title="Total Machines" value={data.totalMachines} icon={Package} />
        <AdminStatCard title="New Listings (30d)" value={data.newListings30d} icon={Package} accent="sky" />
        <AdminStatCard title="Active Listings" value={data.activeListings} icon={Package} accent="emerald" />
        <AdminStatCard title="Sold Machines" value={data.soldMachines} icon={Package} accent="ink" />
        <AdminStatCard title="Total Inquiries" value={data.totalInquiries} icon={MessageSquare} />
        <AdminStatCard title="Favorites" value={data.totalFavorites} icon={Heart} accent="rose" />
        <AdminStatCard title="Reviews" value={data.totalReviews} icon={Star} />
        <AdminStatCard title="Pending Reports" value={data.pendingReports} icon={Flag} accent="rose" />
      </section>
    </div>
  );
}
