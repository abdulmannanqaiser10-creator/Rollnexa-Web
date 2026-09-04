import "server-only";

import { prisma } from "@/lib/db";

export type ReviewItem = {
  id: string;
  rating: number;
  content: string;
  status: "PUBLISHED" | "HIDDEN" | "REMOVED";
  sellerReply: string | null;
  sellerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string | null;
  };
};

export type ReviewSummary = {
  average: number;
  total: number;
  distribution: Array<{ stars: 1 | 2 | 3 | 4 | 5; count: number; percent: number }>;
};

function emptySummary(): ReviewSummary {
  return {
    average: 0,
    total: 0,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars: stars as 1 | 2 | 3 | 4 | 5,
      count: 0,
      percent: 0,
    })),
  };
}

function computeSummary(ratings: number[]): ReviewSummary {
  if (ratings.length === 0) return emptySummary();
  const total = ratings.length;
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratings.filter((r) => r === stars).length;
    return {
      stars: stars as 1 | 2 | 3 | 4 | 5,
      count,
      percent: Math.round((count / total) * 100),
    };
  });
  return {
    average: Math.round((sum / total) * 10) / 10,
    total,
    distribution,
  };
}

export async function canBuyerReviewMachine(params: {
  buyerId: string;
  machineId: string;
  sellerId: string;
}) {
  const [hasInquiry, hasConversation] = await Promise.all([
    prisma.inquiry.findFirst({
      where: {
        buyerId: params.buyerId,
        machineId: params.machineId,
        sellerId: params.sellerId,
      },
      select: { id: true },
    }),
    prisma.conversation.findFirst({
      where: {
        buyerId: params.buyerId,
        machineId: params.machineId,
        sellerId: params.sellerId,
      },
      select: { id: true },
    }),
  ]);

  return Boolean(hasInquiry || hasConversation);
}

export async function getMachineReviewBundle(params: {
  machineId: string;
  userId?: string | null;
  role?: string | null;
}) {
  const rows = await prisma.review.findMany({
    where: {
      machineId: params.machineId,
      status: "PUBLISHED",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      content: true,
      status: true,
      sellerReply: true,
      sellerRepliedAt: true,
      createdAt: true,
      updatedAt: true,
      reviewer: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { avatar: true } },
        },
      },
    },
  });

  const summary = computeSummary(rows.map((r) => r.rating));

  const reviews: ReviewItem[] = rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    content: row.content,
    status: row.status,
    sellerReply: row.sellerReply,
    sellerRepliedAt: row.sellerRepliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    reviewer: {
      id: row.reviewer.id,
      name: row.reviewer.name || "Buyer",
      avatar: row.reviewer.profile?.avatar || row.reviewer.image || null,
    },
  }));

  let userReview: ReviewItem | null = null;
  let canReview = false;

  if (params.userId && params.role === "BUYER") {
    const mine = await prisma.review.findUnique({
      where: {
        reviewerId_machineId: {
          reviewerId: params.userId,
          machineId: params.machineId,
        },
      },
      select: {
        id: true,
        rating: true,
        content: true,
        status: true,
        sellerReply: true,
        sellerRepliedAt: true,
        createdAt: true,
        updatedAt: true,
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: { select: { avatar: true } },
          },
        },
        machine: { select: { sellerId: true } },
      },
    });

    if (mine) {
      userReview = {
        id: mine.id,
        rating: mine.rating,
        content: mine.content,
        status: mine.status,
        sellerReply: mine.sellerReply,
        sellerRepliedAt: mine.sellerRepliedAt?.toISOString() ?? null,
        createdAt: mine.createdAt.toISOString(),
        updatedAt: mine.updatedAt.toISOString(),
        reviewer: {
          id: mine.reviewer.id,
          name: mine.reviewer.name || "Buyer",
          avatar: mine.reviewer.profile?.avatar || mine.reviewer.image || null,
        },
      };
      canReview = true;
    } else {
      const machine = await prisma.machine.findUnique({
        where: { id: params.machineId },
        select: { sellerId: true },
      });
      if (machine) {
        canReview = await canBuyerReviewMachine({
          buyerId: params.userId,
          machineId: params.machineId,
          sellerId: machine.sellerId,
        });
      }
    }
  }

  return { summary, reviews, userReview, canReview };
}

export async function getSellerRatingSummary(sellerId: string): Promise<ReviewSummary> {
  const reviews = await prisma.review.findMany({
    where: { sellerId, status: "PUBLISHED" },
    select: { rating: true },
  });
  return computeSummary(reviews.map((r) => r.rating));
}

export async function getBuyerReviews(buyerId: string) {
  return prisma.review.findMany({
    where: { reviewerId: buyerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      content: true,
      status: true,
      sellerReply: true,
      sellerRepliedAt: true,
      createdAt: true,
      machine: {
        select: {
          id: true,
          title: true,
          slug: true,
          brand: { select: { name: true } },
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          profile: { select: { companyName: true } },
        },
      },
    },
  });
}

export async function getSellerReviews(sellerId: string) {
  return prisma.review.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      content: true,
      status: true,
      sellerReply: true,
      createdAt: true,
      reviewer: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { avatar: true } },
        },
      },
      machine: { select: { id: true, title: true, slug: true } },
    },
  });
}
