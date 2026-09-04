import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  reviewModerationSchema,
  reviewReplySchema,
  reviewUpdateSchema,
} from "@/lib/validations/review";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      [key: string]: unknown;
    } | null;
    const action = typeof body?.action === "string" ? body.action : "update";

    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        reviewerId: true,
        sellerId: true,
        status: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (action === "reply") {
      if (session.user.role !== "SELLER" || review.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const parsed = reviewReplySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid reply" },
          { status: 400 }
        );
      }

      const updated = await prisma.review.update({
        where: { id: review.id },
        data: {
          sellerReply: parsed.data.sellerReply,
          sellerRepliedAt: new Date(),
        },
        select: { id: true, sellerReply: true, sellerRepliedAt: true },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "moderate") {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const parsed = reviewModerationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid moderation input" },
          { status: 400 }
        );
      }

      const updated = await prisma.review.update({
        where: { id: review.id },
        data: {
          status: parsed.data.status,
          moderationNote: parsed.data.moderationNote || null,
          moderatedById: session.user.id,
          moderatedAt: new Date(),
        },
        select: { id: true, status: true, moderatedAt: true },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (session.user.role !== "BUYER" || review.reviewerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = reviewUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid review input" },
        { status: 400 }
      );
    }

    if (!parsed.data.rating && !parsed.data.content) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        rating: parsed.data.rating,
        content: parsed.data.content,
      },
      select: { id: true, rating: true, content: true, updatedAt: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/reviews/[id]] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update review" }, { status: 500 });
  }
}
