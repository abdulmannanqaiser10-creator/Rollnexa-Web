import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { adminUserUpdateSchema } from "@/lib/validations/admin";
import { createNotification } from "@/lib/notifications/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, accountStatus: true, name: true, email: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.id === session.user.id && parsed.data.accountStatus && parsed.data.accountStatus !== "ACTIVE") {
      return NextResponse.json({ error: "You cannot block your own admin account." }, { status: 400 });
    }

    if (target.role === "ADMIN" && target.id !== session.user.id) {
      if (parsed.data.role || parsed.data.accountStatus) {
        return NextResponse.json(
          { error: "Another admin account cannot be modified from this panel." },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        accountStatus: parsed.data.accountStatus,
        role: parsed.data.role,
      },
      select: { id: true, role: true, accountStatus: true },
    });

    const changedStatus =
      parsed.data.accountStatus && parsed.data.accountStatus !== target.accountStatus;
    const changedRole = parsed.data.role && parsed.data.role !== target.role;
    if (changedStatus || changedRole) {
      const details = [
        changedStatus
          ? `Account status changed to ${updated.accountStatus}.`
          : null,
        changedRole ? `Role updated to ${updated.role}.` : null,
      ]
        .filter(Boolean)
        .join(" ");

      await createNotification({
        userId: target.id,
        type: "ACCOUNT_UPDATE",
        title: "Account updated",
        message: details || "Your account settings have been updated.",
        relatedEntityId: target.id,
        relatedEntityType: "USER",
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/admin/users/id] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}
