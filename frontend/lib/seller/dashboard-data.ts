import "server-only";

import { prisma } from "@/lib/db";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
import { formatPrice } from "@/lib/format";
import { parseListingDescription } from "@/lib/machines/detail";

function isMissingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const message =
    "message" in error ? String((error as { message?: string }).message) : "";
  return (
    code === "P2021" ||
    /relation .* does not exist/i.test(message) ||
    /table .* does not exist/i.test(message)
  );
}

function logOptionalRelationError(scope: string, error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code)
      : "unknown";
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message)
      : String(error);

  console.error(`[${scope}] Optional Inquiry/Favorite query failed`, {
    code,
    message: message.slice(0, 500),
  });
}

export type SellerDashboardStats = {
  totalMachines: number;
  activeListings: number;
  draftListings: number;
  soldMachines: number;
  archivedMachines: number;
  totalViews: number;
  totalInquiries: number;
  newInquiries: number;
  totalFavorites: number;
  totalMessages: number;
};

export type SellerDashboardMachine = {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceLabel: string;
  location: string | null;
  status: string;
  createdAt: string;
  brandName: string;
  model: string | null;
  categoryName: string;
  imageUrl: string | null;
  inquiryCount: number;
  favoriteCount: number;
};

export type SellerDashboardInquiry = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  machineTitle: string;
  machineSlug: string;
  buyerName: string;
  buyerImage: string | null;
};

export type SellerDashboardActivity = {
  id: string;
  type: "machine" | "inquiry" | "sold" | "profile";
  title: string;
  description: string;
  createdAt: string;
};

export type SellerDashboardProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  companyName: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  bio: string | null;
  listingCount: number;
  profileCompletion: number;
};

export type SellerDashboardData = {
  sellerName: string;
  stats: SellerDashboardStats;
  machines: SellerDashboardMachine[];
  inquiries: SellerDashboardInquiry[];
  activity: SellerDashboardActivity[];
  profile: SellerDashboardProfile;
};

export async function getSellerDashboardData(
  sellerId: string
): Promise<SellerDashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profile: {
        select: {
          companyName: true,
          city: true,
          country: true,
          phone: true,
          bio: true,
          avatar: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Seller not found");
  }

  const [
    totalMachines,
    activeListings,
    draftListings,
    soldMachines,
    archivedMachines,
    recentMachines,
  ] = await Promise.all([
    prisma.machine.count({ where: { sellerId } }),
    prisma.machine.count({ where: { sellerId, status: "PUBLISHED" } }),
    prisma.machine.count({ where: { sellerId, status: "DRAFT" } }),
    prisma.machine.count({ where: { sellerId, status: "SOLD" } }),
    prisma.machine.count({ where: { sellerId, status: "ARCHIVED" } }),
    prisma.machine.findMany({
      where: { sellerId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        location: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
  ]);

  const interestByMachineId = new Map<
    string,
    { inquiryCount: number; favoriteCount: number }
  >();

  try {
    const counted = await prisma.machine.findMany({
      where: {
        sellerId,
        id: { in: recentMachines.map((machine) => machine.id) },
      },
      select: {
        id: true,
        _count: {
          select: {
            inquiries: true,
            favorites: true,
          },
        },
      },
    });
    for (const row of counted) {
      interestByMachineId.set(row.id, {
        inquiryCount: row._count.inquiries,
        favoriteCount: row._count.favorites,
      });
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    logOptionalRelationError("seller/dashboard/counts", error);
  }

  let totalInquiries = 0;
  let newInquiries = 0;
  let inquiries: SellerDashboardInquiry[] = [];
  let totalFavorites = 0;
  let totalViews = 0;
  let totalMessages = 0;

  try {
    const [
      inquiryTotal,
      inquiryNew,
      recentInquiries,
      favoriteTotal,
      viewsTotal,
      messageTotal,
    ] =
      await Promise.all([
        prisma.inquiry.count({ where: { sellerId } }),
        prisma.inquiry.count({ where: { sellerId, status: "NEW" } }),
        prisma.inquiry.findMany({
          where: { sellerId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            message: true,
            status: true,
            createdAt: true,
            machine: { select: { title: true, slug: true } },
            buyer: {
              select: {
                name: true,
                image: true,
                profile: { select: { avatar: true } },
              },
            },
          },
        }),
        prisma.favorite.count({
          where: { machine: { sellerId } },
        }),
        prisma.recentlyViewed.count({
          where: { machine: { sellerId } },
        }),
        prisma.message.count({
          where: { conversation: { sellerId } },
        }),
      ]);

    totalInquiries = inquiryTotal;
    newInquiries = inquiryNew;
    totalFavorites = favoriteTotal;
    totalViews = viewsTotal;
    totalMessages = messageTotal;
    inquiries = recentInquiries.map((inquiry) => ({
      id: inquiry.id,
      message: inquiry.message,
      status: inquiry.status,
      createdAt: inquiry.createdAt.toISOString(),
      machineTitle: inquiry.machine.title,
      machineSlug: inquiry.machine.slug,
      buyerName: inquiry.buyer.name || "Buyer",
      buyerImage: inquiry.buyer.profile?.avatar || inquiry.buyer.image || null,
    }));
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    logOptionalRelationError("seller/dashboard/inquiries", error);
  }

  const machines: SellerDashboardMachine[] = recentMachines.map((machine) => {
    const { model } = parseListingDescription(machine.description);
    const interest = interestByMachineId.get(machine.id);
    return {
      id: machine.id,
      title: machine.title,
      slug: machine.slug,
      price: machine.price,
      priceLabel: formatPrice(machine.price),
      location: machine.location,
      status: machine.status,
      createdAt: machine.createdAt.toISOString(),
      brandName: machine.brand.name,
      model,
      categoryName: machine.category.name,
      imageUrl: resolveMachineImageUrl(machine.images[0]?.url),
      inquiryCount: interest?.inquiryCount ?? 0,
      favoriteCount: interest?.favoriteCount ?? 0,
    };
  });

  const activity: SellerDashboardActivity[] = [
    ...recentMachines.slice(0, 4).map((machine) => ({
      id: `machine-${machine.id}`,
      type:
        machine.status === "SOLD"
          ? ("sold" as const)
          : ("machine" as const),
      title:
        machine.status === "SOLD"
          ? "Machine marked as sold"
          : machine.createdAt.getTime() === machine.updatedAt.getTime()
            ? "You added a new machine"
            : "You updated a machine listing",
      description: machine.title,
      createdAt: machine.updatedAt.toISOString(),
    })),
    ...inquiries.slice(0, 3).map((inquiry) => ({
      id: `inquiry-${inquiry.id}`,
      type: "inquiry" as const,
      title: "A buyer sent an inquiry",
      description: `${inquiry.buyerName} asked about ${inquiry.machineTitle}`,
      createdAt: inquiry.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6);

  const profileFields = [
    Boolean(user.name),
    Boolean(user.image || user.profile?.avatar),
    Boolean(user.profile?.companyName),
    Boolean(user.profile?.city),
    Boolean(user.profile?.country),
    Boolean(user.profile?.phone),
    Boolean(user.profile?.bio),
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  return {
    sellerName: user.name || user.profile?.companyName || "Seller",
    stats: {
      totalMachines,
      activeListings,
      draftListings,
      soldMachines,
      archivedMachines,
      totalViews,
      totalInquiries,
      newInquiries,
      totalFavorites,
      totalMessages,
    },
    machines,
    inquiries,
    activity,
    profile: {
      id: user.id,
      name: user.name || "Seller",
      email: user.email,
      image: user.profile?.avatar || user.image || null,
      companyName: user.profile?.companyName ?? null,
      city: user.profile?.city ?? null,
      country: user.profile?.country ?? null,
      phone: user.profile?.phone ?? null,
      bio: user.profile?.bio ?? null,
      listingCount: totalMachines,
      profileCompletion,
    },
  };
}
