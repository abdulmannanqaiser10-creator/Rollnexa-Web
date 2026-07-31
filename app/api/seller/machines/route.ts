import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { machineListingSchema } from "@/lib/validations/machine";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const machines = await prisma.machine.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { id: true, url: true, alt: true },
        },
      },
    });

    return NextResponse.json({ success: true, machines });
  } catch (error) {
    console.error("[seller/machines] Failed to list machines:", error);
    return NextResponse.json(
      { error: "Unable to load your machines" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role must come from trusted session — never from request body
    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const { canSellerCreateListing } = await import("@/lib/subscriptions/service");
    const canCreate = await canSellerCreateListing(session.user.id);
    if (!canCreate) {
      return NextResponse.json(
        {
          error: "Listing limit reached for your current plan. Upgrade to add more machines.",
          code: "LISTING_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    const description = data.model?.trim()
      ? `Model: ${data.model.trim()}\n\n${data.description}`
      : data.description;

    const slug = uniqueSlug(data.title);

    const machine = await prisma.$transaction(async (tx) => {
      const created = await tx.machine.create({
        data: {
          title: data.title,
          slug,
          description,
          price: data.price,
          year: data.year,
          hours: data.hours,
          condition: data.condition,
          location: data.location,
          status: "DRAFT",
          sellerId: session.user.id, // trusted session only
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

      if (data.images.length > 0) {
        await tx.machineImage.createMany({
          data: data.images.map((image, index) => ({
            url: image.url,
            publicId: image.publicId || null,
            alt: image.alt || data.title,
            sortOrder: index,
            machineId: created.id,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({
      success: true,
      machine,
    });
  } catch (error) {
    console.error("[seller/machines] Failed to create machine:", error);
    return NextResponse.json(
      { error: "Unable to create listing. Please try again." },
      { status: 500 }
    );
  }
}
