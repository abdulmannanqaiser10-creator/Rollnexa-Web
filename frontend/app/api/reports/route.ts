import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { reportCreateSchema } from "@/lib/validations/admin";
import { notifyActiveAdmins } from "@/lib/notifications/service";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to submit a report" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = reportCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid report" },
        { status: 400 }
      );
    }

    if (!parsed.data.machineId && !parsed.data.reportedUserId) {
      return NextResponse.json(
        { error: "A machine or user must be specified." },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        type: parsed.data.type,
        reason: parsed.data.reason,
        description: parsed.data.description || null,
        reporterId: session.user.id,
        reportedUserId: parsed.data.reportedUserId || null,
        machineId: parsed.data.machineId || null,
      },
      select: { id: true, status: true, createdAt: true, type: true },
    });

    await notifyActiveAdmins({
      type: "ACCOUNT_UPDATE",
      title: "New report submitted",
      message: `A new ${report.type.replaceAll("_", " ").toLowerCase()} report requires review.`,
      relatedEntityId: report.id,
      relatedEntityType: "REPORT",
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("[api/reports] POST failed:", error);
    return NextResponse.json({ error: "Unable to submit report" }, { status: 500 });
  }
}
