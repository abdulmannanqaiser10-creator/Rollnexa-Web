import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { adminBrandSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/slug";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = adminBrandSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug || slugify(parsed.data.name),
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/admin/brands/id] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update brand" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const count = await prisma.machine.count({ where: { brandId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: "Cannot delete a brand linked to machines." },
        { status: 409 }
      );
    }

    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/brands/id] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete brand" }, { status: 500 });
  }
}
