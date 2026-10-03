import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { promotionPackageSchema } from "@/lib/validations/subscription";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = promotionPackageSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid package" }, { status: 400 });
  try { const { id } = await context.params; return NextResponse.json({ success: true, package: await prisma.promotionPackage.update({ where: { id }, data: parsed.data }) }); }
  catch { return NextResponse.json({ error: "Promotion package not found" }, { status: 404 }); }
}
