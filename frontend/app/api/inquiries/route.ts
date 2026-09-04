import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { inquiryCreateSchema } from "@/lib/validations/inquiry";
import { createNotification } from "@/lib/notifications/service";
import { sendInquiryEmail } from "@/lib/emails/service";
import { checkRateLimit, enforceRequestSize, sanitizeText, validateBody, assertSameOrigin, rateLimitResponse } from "@/lib/security";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const inquiries = await prisma.inquiry.findMany({
      where: { buyerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        machine: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
            brand: { select: { name: true } },
          },
        },
        seller: {
          select: {
            name: true,
            profile: { select: { companyName: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: inquiries });
  } catch (error) {
    console.error("[api/inquiries] GET failed:", error);
    return NextResponse.json({ error: "Unable to load inquiries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const originCheck = assertSameOrigin(request);
    if (!originCheck.ok) return originCheck.response;

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to contact the seller" },
        { status: 401 }
      );
    }

    const sizeCheck = await enforceRequestSize(request);
    if (!sizeCheck.ok) {
      return sizeCheck.response;
    }

    const rateLimit = checkRateLimit(request, "inquiry", 20, 60_000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const body = await request.json().catch(() => null);
    const parsed = validateBody(inquiryCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.findFirst({
      where: { id: parsed.data.machineId, status: "PUBLISHED" },
      select: { id: true, sellerId: true, title: true },
    });

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (machine.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot send an inquiry on your own listing" },
        { status: 400 }
      );
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        message: sanitizeText(parsed.data.message),
        machineId: machine.id,
        buyerId: session.user.id,
        sellerId: machine.sellerId,
      },
      select: { id: true, createdAt: true },
    });

    await createNotification({
      userId: machine.sellerId,
      type: "NEW_INQUIRY",
      title: "New inquiry received",
      message: `New inquiry received for your "${machine.title}" listing.`,
      relatedEntityId: inquiry.id,
      relatedEntityType: "INQUIRY",
    });

    try {
      await sendInquiryEmail({
        sellerId: machine.sellerId,
        buyerId: session.user.id,
        machineName: machine.title,
        replyUrl: `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}/seller/inquiries/${inquiry.id}`,
      });
    } catch (error) {
      console.error("[api/inquiries] inquiry email failed", error);
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: "Inquiry sent successfully",
    });
  } catch (error) {
    console.error("[api/inquiries] Failed:", error);
    return NextResponse.json({ error: "Unable to send inquiry" }, { status: 500 });
  }
}
