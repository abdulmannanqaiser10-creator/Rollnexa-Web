import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { reviewCreateSchema } from "@/lib/validations/review";
import { createNotification } from "@/lib/notifications/service";
import { sanitizeText, validateBody, checkRateLimit, rateLimitResponse, assertSameOrigin } from "@/lib/security";
import {
  canBuyerReviewMachine,
  getBuyerReviews,
  getMachineReviewBundle,
  getSellerReviews,
  getSellerRatingSummary,
} from "@/lib/reviews/query";

function isUniqueConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machineId");
    const sellerId = searchParams.get("sellerId");
    const mine = searchParams.get("mine");
    const session = await getSession();

    if (machineId) {
      const bundle = await getMachineReviewBundle({
        machineId,
        userId: session?.user?.id,
        role: session?.user?.role,
      });
      return NextResponse.json({ success: true, data: bundle });
    }

    if (sellerId) {
      const [reviews, summary] = await Promise.all([
        getSellerReviews(sellerId),
        getSellerRatingSummary(sellerId),
      ]);
      return NextResponse.json({ success: true, data: { reviews, summary } });
    }

    if (mine === "1") {
      if (!session?.user?.id || session.user.role !== "BUYER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const reviews = await getBuyerReviews(session.user.id);
      return NextResponse.json({ success: true, data: reviews });
    }

    return NextResponse.json({ error: "Missing review query target" }, { status: 400 });
  } catch (error) {
    console.error("[api/reviews] GET failed:", error);
    return NextResponse.json({ error: "Unable to load reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const originCheck = assertSameOrigin(request);
    if (!originCheck.ok) return originCheck.response;

    const rateLimit = checkRateLimit(request, "review-create", 15, 60_000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to submit a review" }, { status: 401 });
    }
    if (session.user.role !== "BUYER") {
      return NextResponse.json({ error: "Only buyers can submit reviews" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = validateBody(reviewCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid review input" },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.findUnique({
      where: { id: parsed.data.machineId },
      select: { id: true, sellerId: true, status: true, title: true },
    });

    if (!machine || machine.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (machine.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review your own listing" },
        { status: 400 }
      );
    }

    const eligible = await canBuyerReviewMachine({
      buyerId: session.user.id,
      machineId: machine.id,
      sellerId: machine.sellerId,
    });

    if (!eligible) {
      return NextResponse.json(
        {
          error:
            "You can review a machine after interacting with the seller (inquiry or conversation).",
        },
        { status: 403 }
      );
    }

    const existing = await prisma.review.findUnique({
      where: {
        reviewerId_machineId: {
          reviewerId: session.user.id,
          machineId: machine.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already reviewed this machine. You can edit your review.", reviewId: existing.id },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        machineId: machine.id,
        sellerId: machine.sellerId,
        rating: parsed.data.rating,
        content: sanitizeText(parsed.data.content),
      },
      select: { id: true, rating: true, content: true, createdAt: true },
    });

    await createNotification({
      userId: machine.sellerId,
      type: "NEW_REVIEW",
      title: "New review received",
      message: `You received a new review for "${machine.title}".`,
      relatedEntityId: machine.id,
      relatedEntityType: "MACHINE",
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json(
        { error: "You already reviewed this machine. Edit your existing review." },
        { status: 409 }
      );
    }
    console.error("[api/reviews] POST failed:", error);
    return NextResponse.json({ error: "Unable to submit review" }, { status: 500 });
  }
}
