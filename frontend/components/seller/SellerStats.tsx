import {
  CheckCircle2,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Package,
} from "lucide-react";
import { StatCard } from "@/components/seller/StatCard";
import type { SellerDashboardStats } from "@/lib/seller/dashboard-data";

type SellerStatsProps = {
  stats: SellerDashboardStats;
};

export function SellerStats({ stats }: SellerStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard
        title="Total Machines"
        value={stats.totalMachines}
        description="All listings in your inventory"
        icon={Package}
        accent="ink"
      />
      <StatCard
        title="Active Listings"
        value={stats.activeListings}
        description={`${stats.draftListings} draft${stats.draftListings === 1 ? "" : "s"} waiting`}
        icon={FileText}
        accent="gold"
      />
      <StatCard
        title="Total Views"
        value={stats.totalViews}
        description="Times buyers viewed your listings"
        icon={Eye}
        accent="sky"
      />
      <StatCard
        title="New Inquiries"
        value={stats.newInquiries}
        description={`${stats.totalInquiries} total inquiries`}
        icon={MessageSquare}
        accent="emerald"
      />
      <StatCard
        title="Sold Machines"
        value={stats.soldMachines}
        description={`${stats.archivedMachines} archived`}
        icon={CheckCircle2}
        accent="emerald"
      />
      <StatCard
        title="Saved by Buyers"
        value={stats.totalFavorites}
        description="Favorites on your machines"
        icon={Heart}
        accent="gold"
      />
    </section>
  );
}
