import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";
import { promotionPackageSchema } from "@/lib/validations/subscription";

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const packages = await prisma.promotionPackage.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json({ success: true, packages });
}

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = promotionPackageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid package" }, { status: 400 });
  try { return NextResponse.json({ success: true, package: await prisma.promotionPackage.create({ data: parsed.data }) }, { status: 201 }); }
  catch (error) { console.error("[admin/promotion-packages] create failed", error); return NextResponse.json({ error: "Unable to create package" }, { status: 409 }); }
}
