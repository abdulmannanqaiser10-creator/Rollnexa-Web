import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { adminReportUpdateSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = adminReportUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes || null,
        resolvedById:
          parsed.data.status === "RESOLVED" || parsed.data.status === "REJECTED"
            ? session.user.id
            : undefined,
        resolvedAt:
          parsed.data.status === "RESOLVED" || parsed.data.status === "REJECTED"
            ? new Date()
            : undefined,
      },
      select: { id: true, status: true, adminNotes: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/admin/reports/id] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update report" }, { status: 500 });
  }
}
