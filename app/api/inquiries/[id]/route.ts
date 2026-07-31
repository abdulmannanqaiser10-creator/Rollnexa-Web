import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createNotification } from "@/lib/notifications/service";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "CLOSED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid inquiry ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    // Only the seller who owns the inquiry may update its status
    const inquiry = await prisma.inquiry.findFirst({
      where: { id, sellerId: session.user.id },
      select: { id: true, buyerId: true, machine: { select: { title: true } } },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    if (parsed.data.status === "REPLIED" || parsed.data.status === "READ") {
      await createNotification({
        userId: inquiry.buyerId,
        type: "ACCOUNT_UPDATE",
        title:
          parsed.data.status === "REPLIED"
            ? "Seller replied to your inquiry"
            : "Inquiry update",
        message:
          parsed.data.status === "REPLIED"
            ? `The seller responded to your inquiry about "${inquiry.machine.title}".`
            : `Your inquiry about "${inquiry.machine.title}" was viewed by the seller.`,
        relatedEntityId: inquiry.id,
        relatedEntityType: "INQUIRY",
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/inquiries/[id]] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update inquiry" }, { status: 500 });
  }
}
