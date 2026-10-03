import { getRequestHeaders } from "@/lib/request-context";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  assertSellerTransition,
  type ListingStatusValue,
} from "@/lib/machines/listing-status";

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "SOLD", "ARCHIVED"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.machine.findFirst({
      where: { id, sellerId: session.user.id },
      select: { id: true, sellerId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (existing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const nextStatus = parsed.data.status as ListingStatusValue;

    try {
      assertSellerTransition(existing.status, nextStatus);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "This status change is not allowed.",
        },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        ...(nextStatus === "PENDING_REVIEW"
          ? {
              submittedForReviewAt: new Date(),
              rejectionReason: null,
              rejectedAt: null,
              rejectedById: null,
            }
          : {}),
      },
      select: { id: true, status: true, slug: true, title: true },
    });

    return NextResponse.json({
      success: true,
      message: "Machine status updated successfully.",
      machine,
    });
  } catch (error) {
    console.error("[seller/machines/status] PATCH failed:", error);
    return NextResponse.json(
      { error: "Failed to update machine status." },
      { status: 500 }
    );
  }
}
