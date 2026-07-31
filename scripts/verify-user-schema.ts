import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";

const LISTING_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "REJECTED",
  "PUBLISHED",
  "SOLD",
  "ARCHIVED",
] as const;

async function main() {
  const { prisma, pool } = createScriptPrisma();

  try {
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });

    console.log("user.findMany() OK");
    console.log(`Fetched ${users.length} users`);

    const statusCounts = await Promise.all(
      LISTING_STATUSES.map(async (status) => ({
        status,
        count: await prisma.machine.count({ where: { status } }),
      }))
    );

    console.log("ListingStatus enum queries OK:");
    for (const row of statusCounts) {
      console.log(`  ${row.status}: ${row.count}`);
    }

    const [notifications, pendingReview, reports] = await Promise.all([
      prisma.notification.count(),
      prisma.machine.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    console.log("Related models OK:", {
      notifications,
      pendingReviewListings: pendingReview,
      pendingReports: reports,
    });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
