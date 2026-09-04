import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { logAdminActivity } from "@/lib/admin/activity-log";
import { adminCategorySchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/slug";

export async function POST(request: Request) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = adminCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const slug = parsed.data.slug || slugify(parsed.data.name);
    const created = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
      },
      select: { id: true, name: true, slug: true },
    });
    await logAdminActivity({
      userId: session.user.id,
      action: "CATEGORY_CREATED",
      description: `Created category "${created.name}".`,
      targetId: created.id,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("[api/admin/categories] POST failed:", error);
    return NextResponse.json({ error: "Unable to create category" }, { status: 500 });
  }
}
