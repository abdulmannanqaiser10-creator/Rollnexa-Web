import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { logAdminActivity } from "@/lib/admin/activity-log";
import { adminPlanSchema } from "@/lib/validations/subscription";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = adminPlanSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid plan data" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: parsed.data,
    });
    await logAdminActivity({
      userId: session.user.id,
      action: "SUBSCRIPTION_PLAN_UPDATED",
      description: `Updated subscription plan "${plan.name}".`,
      targetId: plan.id,
    });
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("[api/admin/subscriptions/plans/id] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update plan" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });
    await logAdminActivity({
      userId: session.user.id,
      action: "SUBSCRIPTION_PLAN_ARCHIVED",
      description: `Deactivated subscription plan "${plan.name}".`,
      targetId: plan.id,
    });
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("[api/admin/subscriptions/plans/id] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to deactivate plan" }, { status: 500 });
  }
}
