import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateListingForSubmission } from "@/lib/machines/submission";
import { parseListingDescription } from "@/lib/machines/detail";
import { notifyActiveAdmins } from "@/lib/notifications/service";
import {
  assertSellerTransition,
  isSellerEditableStatus,
} from "@/lib/machines/listing-status";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountStatus: true },
    });

    if (seller?.accountStatus === "BLOCKED" || seller?.accountStatus === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your seller account is not allowed to submit listings." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const machine = await prisma.machine.findFirst({
      where: { id, sellerId: session.user.id },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, publicId: true, alt: true, id: true },
        },
      },
    });

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (!isSellerEditableStatus(machine.status)) {
      return NextResponse.json(
        {
          error:
            machine.status === "PENDING_REVIEW"
              ? "This listing is awaiting admin review."
              : "This listing cannot be submitted for approval in its current state.",
        },
        { status: 400 }
      );
    }

    try {
      assertSellerTransition(machine.status, "PENDING_REVIEW");
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid status transition" },
        { status: 400 }
      );
    }

    const { model, body } = parseListingDescription(machine.description);

    const validation = validateListingForSubmission({
      title: machine.title,
      categoryId: machine.categoryId,
      brandId: machine.brandId,
      model: model || "",
      year: machine.year ?? new Date().getFullYear(),
      condition: machine.condition,
      hours: machine.hours ?? 0,
      price: machine.price,
      location: machine.location || "",
      description: body || "",
      images: machine.images.map((image) => ({
        url: image.url,
        publicId: image.publicId,
        alt: image.alt,
        id: image.id,
      })),
      status: "DRAFT",
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: {
        status: "PENDING_REVIEW",
        submittedForReviewAt: new Date(),
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      },
      select: { id: true, status: true, slug: true, title: true },
    });

    await notifyActiveAdmins({
      type: "ACCOUNT_UPDATE",
      title: "New listing pending review",
      message: `A new listing "${machine.title}" has been submitted for approval.`,
      relatedEntityId: machine.id,
      relatedEntityType: "MACHINE",
    });

    return NextResponse.json({
      success: true,
      message: "Listing submitted for admin approval.",
      machine: updated,
    });
  } catch (error) {
    console.error("[seller/machines/submit] POST failed:", error);
    return NextResponse.json(
      { error: "Unable to submit listing for approval." },
      { status: 500 }
    );
  }
}
