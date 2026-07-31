import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { machineListingSchema } from "@/lib/validations/machine";
import { parseListingDescription } from "@/lib/machines/detail";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireSellerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.user.role !== "SELLER") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

async function getOwnedMachine(machineId: string, sellerId: string) {
  return prisma.machine.findFirst({
    where: { id: machineId, sellerId },
    include: {
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, publicId: true, alt: true, sortOrder: true },
      },
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const authResult = await requireSellerSession();
    if ("error" in authResult && authResult.error) return authResult.error;

    const { id } = await context.params;
    const machine = await getOwnedMachine(id, authResult.session!.user.id);

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const { model, body } = parseListingDescription(machine.description);

    return NextResponse.json({
      success: true,
      machine: {
        id: machine.id,
        title: machine.title,
        slug: machine.slug,
        model,
        description: body || "",
        price: machine.price,
        year: machine.year,
        hours: machine.hours,
        condition: machine.condition,
        location: machine.location,
        status: machine.status,
        rejectionReason: machine.rejectionReason,
        rejectedAt: machine.rejectedAt?.toISOString() ?? null,
        submittedForReviewAt: machine.submittedForReviewAt?.toISOString() ?? null,
        categoryId: machine.categoryId,
        brandId: machine.brandId,
        images: machine.images,
      },
    });
  } catch (error) {
    console.error("[seller/machines/id] GET failed:", error);
    return NextResponse.json({ error: "Unable to load machine" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authResult = await requireSellerSession();
    if ("error" in authResult && authResult.error) return authResult.error;

    const sellerId = authResult.session!.user.id;
    const { id } = await context.params;

    const existing = await prisma.machine.findFirst({
      where: { id, sellerId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (existing.sellerId !== sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (existing.status === "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "This listing is awaiting admin review and cannot be edited." },
        { status: 400 }
      );
    }

    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Only draft or rejected listings can be edited." },
        { status: 400 }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = machineListingSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid listing data",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const [category, brand] = await Promise.all([
      prisma.category.findUnique({ where: { id: data.categoryId } }),
      prisma.brand.findUnique({ where: { id: data.brandId } }),
    ]);

    if (!category) {
      return NextResponse.json({ error: "Selected category is invalid" }, { status: 400 });
    }
    if (!brand) {
      return NextResponse.json({ error: "Selected brand is invalid" }, { status: 400 });
    }

    const description = data.model?.trim()
      ? `Model: ${data.model.trim()}\n\n${data.description}`
      : data.description;

    const machine = await prisma.$transaction(async (tx) => {
      const updated = await tx.machine.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          description,
          price: data.price,
          year: data.year,
          hours: data.hours,
          condition: data.condition,
          location: data.location,
          status: "DRAFT",
          categoryId: category.id,
          brandId: brand.id,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      });

      await tx.machineImage.deleteMany({ where: { machineId: existing.id } });

      if (data.images.length > 0) {
        await tx.machineImage.createMany({
          data: data.images.map((image, index) => ({
            url: image.url,
            publicId: image.publicId || null,
            alt: image.alt || data.title,
            sortOrder: index,
            machineId: existing.id,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Machine updated successfully.",
      machine,
    });
  } catch (error) {
    console.error("[seller/machines/id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Failed to update machine." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const authResult = await requireSellerSession();
    if ("error" in authResult && authResult.error) return authResult.error;

    const sellerId = authResult.session!.user.id;
    const { id } = await context.params;

    const existing = await prisma.machine.findFirst({
      where: { id, sellerId },
      select: { id: true, sellerId: true, title: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (existing.sellerId !== sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Favorites / inquiries / images cascade via schema onDelete
    await prisma.machine.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: "Machine deleted successfully.",
    });
  } catch (error) {
    console.error("[seller/machines/id] DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to delete machine." },
      { status: 500 }
    );
  }
}
