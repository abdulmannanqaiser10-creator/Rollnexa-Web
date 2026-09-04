import Link from "next/link";
import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Flag,
  Package,
  Star,
  Users,
} from "lucide-react";
import { getAdminDashboardStats } from "@/lib/admin/dashboard-data";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export const metadata = { title: "Admin Dashboard — Rollnexa" };

export default async function AdminDashboardPage() {
  let stats = {
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalMachines: 0,
    activeListings: 0,
    soldMachines: 0,
    draftListings: 0,
    totalInquiries: 0,
    totalReviews: 0,
    pendingReports: 0,
    pendingReviewListings: 0,
    featuredMachines: 0,
  };
  let loadError: string | null = null;

  try {
    stats = await getAdminDashboardStats();
  } catch (error) {
    console.error("[admin/dashboard] stats failed:", error);
    loadError = "Unable to load dashboard statistics.";
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="rn-eyebrow">Platform Control</p>
        <h1 className="rn-page-title">Admin Overview</h1>
        <p className="mt-2 text-sm text-rn-muted">
          Real marketplace activity across users, listings, inquiries, and trust operations.
        </p>
      </header>

      {loadError ? (
        <div className="rn-panel border border-rose-200 bg-rose-50 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <AdminStatCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <AdminStatCard title="Buyers" value={stats.totalBuyers} icon={Users} accent="sky" />
        <AdminStatCard title="Sellers" value={stats.totalSellers} icon={Users} accent="emerald" />
        <AdminStatCard title="Total Machines" value={stats.totalMachines} icon={Package} />
        <AdminStatCard title="Active Listings" value={stats.activeListings} icon={Package} accent="emerald" />
        <AdminStatCard title="Pending Review" value={stats.pendingReviewListings} icon={ClipboardCheck} accent="rose" />
        <AdminStatCard title="Sold Machines" value={stats.soldMachines} icon={Package} accent="ink" />
        <AdminStatCard title="Draft Listings" value={stats.draftListings} icon={FileText} />
        <AdminStatCard title="Total Inquiries" value={stats.totalInquiries} icon={FileText} accent="sky" />
        <AdminStatCard title="Total Reviews" value={stats.totalReviews} icon={Star} />
        <AdminStatCard title="Pending Reports" value={stats.pendingReports} icon={Flag} accent="rose" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { href: "/admin/users", title: "User Management", description: "Search, filter, and manage account status.", icon: Users },
          { href: "/admin/approvals", title: "Approval Queue", description: "Review pending listings and approve or reject submissions.", icon: ClipboardCheck },
          { href: "/admin/machines", title: "Machine Management", description: "Moderate listings, feature machines, and update status.", icon: Package },
          { href: "/admin/reports", title: "Reports Queue", description: "Review and resolve user-submitted reports.", icon: AlertTriangle },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="rn-card-hover p-5">
            <span className="rn-stat-icon">
              <card.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-rn-ink">{card.title}</h3>
            <p className="mt-1 text-sm text-rn-muted">{card.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
