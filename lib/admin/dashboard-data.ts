import "server-only";

import { prisma } from "@/lib/db";

export type AdminDashboardStats = {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalMachines: number;
  activeListings: number;
  pendingReviewListings: number;
  soldMachines: number;
  draftListings: number;
  totalInquiries: number;
  totalReviews: number;
  pendingReports: number;
  featuredMachines: number;
};

export type AdminAnalyticsData = AdminDashboardStats & {
  newUsers30d: number;
  newListings30d: number;
  totalFavorites: number;
  totalMessages: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    totalUsers,
    totalBuyers,
    totalSellers,
    totalMachines,
    activeListings,
    pendingReviewListings,
    soldMachines,
    draftListings,
    totalInquiries,
    totalReviews,
    pendingReports,
    featuredMachines,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.machine.count(),
    prisma.machine.count({ where: { status: "PUBLISHED" } }),
    prisma.machine.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.machine.count({ where: { status: "SOLD" } }),
    prisma.machine.count({ where: { status: "DRAFT" } }),
    prisma.inquiry.count(),
    prisma.review.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.machine.count({ where: { isFeatured: true, status: "PUBLISHED" } }),
  ]);

  return {
    totalUsers,
    totalBuyers,
    totalSellers,
    totalMachines,
    activeListings,
    pendingReviewListings,
    soldMachines,
    draftListings,
    totalInquiries,
    totalReviews,
    pendingReports,
    featuredMachines,
  };
}

export async function getAdminAnalyticsData(): Promise<AdminAnalyticsData> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [base, newUsers30d, newListings30d, totalFavorites, totalMessages] =
    await Promise.all([
      getAdminDashboardStats(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.machine.count({ where: { createdAt: { gte: since } } }),
      prisma.favorite.count(),
      prisma.message.count(),
    ]);

  return {
    ...base,
    newUsers30d,
    newListings30d,
    totalFavorites,
    totalMessages,
  };
}
