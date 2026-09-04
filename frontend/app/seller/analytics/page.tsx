import { redirect } from "next/navigation";
import { BarChart3, Eye, Heart, MessageSquare, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getSellerDashboardData } from "@/lib/seller/dashboard-data";
import { prisma } from "@/lib/db";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";

export const metadata = { title: "Analytics — Rollnexa Seller" };

export default async function SellerAnalyticsPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const [dashboard, machinePerformance] = await Promise.all([
    getSellerDashboardData(session.user.id),
    prisma.machine.findMany({
      where: { sellerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        _count: { select: { favorites: true, inquiries: true, recentlyViewed: true } },
      },
    }),
  ]);

  const topViews = [...machinePerformance]
    .sort((a, b) => b._count.recentlyViewed - a._count.recentlyViewed)
    .slice(0, 5);

  const topInquiries = [...machinePerformance]
    .sort((a, b) => b._count.inquiries - a._count.inquiries)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-[#111827]">Analytics</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Performance from real listing activity in your account.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rn-stat-card">
          <span className="rn-stat-icon"><Eye className="size-5" /></span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">Listing Views</p>
            <p className="font-display text-2xl font-bold text-[#111827]">
              {dashboard.stats.totalViews.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="rn-stat-card">
          <span className="rn-stat-icon"><Heart className="size-5" /></span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">Favorites</p>
            <p className="font-display text-2xl font-bold text-[#111827]">
              {dashboard.stats.totalFavorites.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="rn-stat-card">
          <span className="rn-stat-icon"><MessageSquare className="size-5" /></span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">Inquiries</p>
            <p className="font-display text-2xl font-bold text-[#111827]">
              {dashboard.stats.totalInquiries.toLocaleString()}
            </p>
            <p className="text-xs text-[#6B7280]">{dashboard.stats.newInquiries} new</p>
          </div>
        </div>
        <div className="rn-stat-card">
          <span className="rn-stat-icon"><TrendingUp className="size-5" /></span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">Messages</p>
            <p className="font-display text-2xl font-bold text-[#111827]">
              {dashboard.stats.totalMessages.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rn-panel">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="size-4 text-[#F5B800]" />
            <h2 className="font-display text-lg font-bold text-[#111827]">Top Listings by Views</h2>
          </div>
          {topViews.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No listing views yet.</p>
          ) : (
            <ul className="space-y-3">
              {topViews.map((machine) => (
                <li key={machine.id} className="flex items-center justify-between gap-3 rounded-lg border border-black/5 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111827]">{machine.title}</p>
                    <div className="mt-1"><MachineStatusBadge status={machine.status} /></div>
                  </div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {machine._count.recentlyViewed.toLocaleString()} views
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rn-panel">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="size-4 text-[#F5B800]" />
            <h2 className="font-display text-lg font-bold text-[#111827]">Top Listings by Inquiries</h2>
          </div>
          {topInquiries.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No inquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {topInquiries.map((machine) => (
                <li key={machine.id} className="flex items-center justify-between gap-3 rounded-lg border border-black/5 px-3 py-2.5">
                  <p className="min-w-0 truncate text-sm font-semibold text-[#111827]">{machine.title}</p>
                  <p className="text-sm font-semibold text-[#111827]">
                    {machine._count.inquiries.toLocaleString()} inquiries
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
