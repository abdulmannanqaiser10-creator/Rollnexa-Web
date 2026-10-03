import { getRequestHeaders } from "@/lib/request-context";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
import { uniqueSlug } from "@/lib/slug";
import { machineListingSchema } from "@/lib/validations/machine";
import { sanitizeText, validateBody } from "@/lib/security";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
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

    const machinesWithResolvedImages = machines.map((machine) => ({
      ...machine,
      images: machine.images.map((image) => ({
        ...image,
        url: resolveMachineImageUrl(image.url) ?? image.url,
      })),
    }));

    return NextResponse.json({ success: true, machines: machinesWithResolvedImages });
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
      headers: getRequestHeaders(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role must come from trusted session — never from request body
    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = validateBody(machineListingSchema, body);

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

    const { checkListingEntitlement } = await import("@/lib/subscriptions/service");
    const entitlement = await checkListingEntitlement(session.user.id);
    if (!entitlement.canCreateListing) {
      return NextResponse.json(
        {
          error: "Your free or subscription listing allowance has been used. Choose a seller plan to add more listings.",
          code: entitlement.reason,
          entitlement,
        },
        { status: 403 }
      );
    }

    const description = sanitizeText(
      data.model?.trim()
        ? `Model: ${data.model.trim()}\n\n${data.description}`
        : data.description
    );

    const slug = uniqueSlug(data.title);

    const machine = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const [user, freePlan, subscription] = await Promise.all([
        tx.user.update({ where: { id: session.user.id }, data: { listingMutationVersion: { increment: 1 } }, select: { accountStatus: true, freeListingsUsed: true } }),
        tx.subscriptionPlan.findUnique({ where: { slug: "free" } }),
        tx.userSubscription.findFirst({ where: { userId: session.user.id, status: "ACTIVE", OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] }, include: { plan: true }, orderBy: { createdAt: "desc" } }),
      ]);
      if (user.accountStatus !== "ACTIVE") throw new Error("SELLER_DISABLED");
      const plan = subscription?.plan ?? freePlan;
      if (!plan || !plan.isActive) throw new Error("PLAN_INACTIVE");
      const currentListings = await tx.machine.count({ where: { sellerId: session.user.id, status: { in: ["DRAFT", "PENDING_REVIEW", "PUBLISHED"] } } });
      if (plan.maxListings != null && currentListings >= plan.maxListings) throw new Error("LISTING_LIMIT_REACHED");
      if (plan.slug === "free") {
        const historicalListings = await tx.machine.count({ where: { sellerId: session.user.id } });
        const alreadyUsed = Math.max(user.freeListingsUsed, historicalListings);
        if (alreadyUsed >= (freePlan?.maxListings ?? 1)) throw new Error("NO_SUBSCRIPTION");
        await tx.user.update({ where: { id: session.user.id }, data: { freeListingsUsed: alreadyUsed + 1 } });
      }
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
    if (error instanceof Error && ["SELLER_DISABLED", "PLAN_INACTIVE", "LISTING_LIMIT_REACHED", "NO_SUBSCRIPTION"].includes(error.message)) {
      return NextResponse.json({ error: "Your listing allowance has been used. Upgrade your plan to continue.", code: error.message }, { status: 403 });
    }
    console.error("[seller/machines] Failed to create machine:", error);
    return NextResponse.json(
      { error: "Unable to create listing. Please try again." },
      { status: 500 }
    );
  }
}
