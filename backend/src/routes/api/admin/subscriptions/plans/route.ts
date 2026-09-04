import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { logAdminActivity } from "@/lib/admin/activity-log";
import { adminPlanSchema } from "@/lib/validations/subscription";

export async function GET() {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("[api/admin/subscriptions/plans] GET failed:", error);
    return NextResponse.json({ error: "Unable to load plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = adminPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid plan data" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({ data: parsed.data });
    await logAdminActivity({
      userId: session.user.id,
      action: "SUBSCRIPTION_PLAN_CREATED",
      description: `Created subscription plan "${plan.name}".`,
      targetId: plan.id,
    });
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("[api/admin/subscriptions/plans] POST failed:", error);
    return NextResponse.json({ error: "Unable to create plan" }, { status: 500 });
  }
}
