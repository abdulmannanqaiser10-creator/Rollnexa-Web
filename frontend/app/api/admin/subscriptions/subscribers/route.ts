import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";

export async function GET() {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subscribers = await prisma.userSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        plan: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, subscribers });
  } catch (error) {
    console.error("[api/admin/subscriptions/subscribers] GET failed:", error);
    return NextResponse.json({ error: "Unable to load subscribers" }, { status: 500 });
  }
}
