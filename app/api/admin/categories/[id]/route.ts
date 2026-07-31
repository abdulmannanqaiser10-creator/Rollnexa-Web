import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { adminCategorySchema } from "@/lib/validations/admin";
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
    const parsed = adminCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug || slugify(parsed.data.name),
        description: parsed.data.description || null,
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/admin/categories/id] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update category" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const count = await prisma.machine.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category linked to machines." },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/categories/id] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete category" }, { status: 500 });
  }
}
