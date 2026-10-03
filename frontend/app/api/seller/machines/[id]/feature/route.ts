import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canSellerFeatureListing } from "@/lib/subscriptions/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const machine = await prisma.machine.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true, isFeatured: true },
    });

    if (!machine || machine.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (machine.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Only published listings can be featured" },
        { status: 400 }
      );
    }

    if (machine.isFeatured) {
      return NextResponse.json({ success: true, machine });
    }

    const allowed = await canSellerFeatureListing(session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Featured listing limit reached. Upgrade your plan." },
        { status: 403 }
      );
    }

    const updated = await prisma.machine.update({
      where: { id },
      data: { isFeatured: true },
      select: { id: true, isFeatured: true, slug: true, title: true },
    });

    return NextResponse.json({ success: true, machine: updated });
  } catch (error) {
    console.error("[api/seller/machines/id/feature] POST failed:", error);
    return NextResponse.json({ error: "Unable to feature listing" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const machine = await prisma.machine.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!machine || machine.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const updated = await prisma.machine.update({
      where: { id },
      data: { isFeatured: false },
      select: { id: true, isFeatured: true },
    });

    return NextResponse.json({ success: true, machine: updated });
  } catch (error) {
    console.error("[api/seller/machines/id/feature] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to unfeature listing" }, { status: 500 });
  }
}
