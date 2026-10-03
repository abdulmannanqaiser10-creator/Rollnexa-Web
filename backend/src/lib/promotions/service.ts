import "server-only";
import { prisma } from "@/lib/db";
import { getDefaultPaymentProviderId, getPaymentProvider } from "@/lib/payments/registry";
import { getFreePlan } from "@/lib/subscriptions/plans";
import { randomUUID } from "node:crypto";

const DEFAULT_PACKAGES = [
  { name: "Boost", slug: "boost", description: "Higher position in relevant search results", price: 500, currency: "PKR", durationDays: 3, priority: 1, placementType: "SEARCH", badgeType: "NONE", displayOrder: 1 },
  { name: "Featured", slug: "featured", description: "Featured badge and better category placement", price: 1000, currency: "PKR", durationDays: 7, priority: 2, placementType: "SEARCH_CATEGORY", badgeType: "FEATURED", displayOrder: 2 },
  { name: "Premium", slug: "premium", description: "Premium placement and sponsored badge", price: 2500, currency: "PKR", durationDays: 14, priority: 3, placementType: "SEARCH_CATEGORY_HOME", badgeType: "PREMIUM", displayOrder: 3 },
];

export async function ensureDefaultPromotionPackages() {
  for (const data of DEFAULT_PACKAGES) {
    const exists = await prisma.promotionPackage.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (!exists) await prisma.promotionPackage.create({ data: { ...data, isActive: true } });
  }
}

export async function getPromotionPackages() {
  await ensureDefaultPromotionPackages();
  return prisma.promotionPackage.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } });
}

export async function createPromotionCheckout(input: { userId: string; listingId: string; packageSlug: string; customerEmail: string; customerName: string; customerPhone?: string }) {
  const [listing, pkg] = await Promise.all([
    prisma.machine.findFirst({ where: { id: input.listingId, sellerId: input.userId, status: "PUBLISHED" }, select: { id: true, title: true } }),
    prisma.promotionPackage.findFirst({ where: { slug: input.packageSlug, isActive: true } }),
  ]);
  if (!listing) return { error: "Eligible listing not found" as const, status: 404 as const };
  if (!pkg) return { error: "Promotion package not found" as const, status: 404 as const };
  const now = new Date();
  const active = await prisma.listingPromotion.findFirst({ where: { listingId: listing.id, status: "ACTIVE", startAt: { lte: now }, endAt: { gt: now } } });
  if (active) return { error: "This listing already has an active promotion" as const, status: 409 as const };
  if (pkg.currency !== "PKR" || getDefaultPaymentProviderId() !== "safepay") return { error: "Verified Pakistan checkout is not configured" as const, status: 503 as const };
  const freePlan = await getFreePlan();
  const paymentId = `pay_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const { payment, promotion } = await prisma.$transaction(async (tx) => {
    await tx.machine.update({ where: { id: listing.id }, data: { updatedAt: new Date() } });
    if (await tx.listingPromotion.findFirst({ where: { listingId: listing.id, status: { in: ["ACTIVE", "PENDING"] } } })) throw new Error("PROMOTION_ALREADY_PENDING");
    const payment = await tx.payment.create({ data: {
      paymentId, userId: input.userId, planId: freePlan.id, amount: pkg.price, currency: pkg.currency,
      paymentMethod: "OTHER", paymentProvider: "SAFEPAY", paymentStatus: "PENDING",
      invoiceNumber: `INV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,4).toUpperCase()}`,
      metadata: { purpose: "LISTING_PROMOTION", listingId: listing.id, packageId: pkg.id, packageName: pkg.name, durationDays: pkg.durationDays, priority: pkg.priority, badgeType: pkg.badgeType },
    } });
    const promotion = await tx.listingPromotion.create({ data: {
      sellerId: input.userId, listingId: listing.id, packageId: pkg.id,
      packageNameSnapshot: pkg.name, priceSnapshot: pkg.price, currencySnapshot: pkg.currency,
      durationSnapshot: pkg.durationDays, prioritySnapshot: pkg.priority, badgeTypeSnapshot: pkg.badgeType,
      status: "PENDING", paymentId: payment.id,
    } });
    return { payment, promotion };
  }).catch((error) => { if (error instanceof Error && error.message === "PROMOTION_ALREADY_PENDING") throw new Error("This listing already has an active or pending promotion"); throw error; });
  const provider = getPaymentProvider("safepay");
  try {
    const baseUrl = process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const checkout = await provider.createCheckoutSession({ paymentId: payment.id, userId: input.userId, planSlug: `promotion-${pkg.slug}`, amount: pkg.price, currency: pkg.currency, successUrl: `${baseUrl}/seller/payments?status=verifying`, cancelUrl: `${baseUrl}/seller/payments?status=failed`, metadata: { customerEmail: input.customerEmail, customerName: input.customerName, customerPhone: input.customerPhone || "", internalPaymentReference: payment.id } });
    return { payment, promotion, checkout };
  } catch (error) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { paymentStatus: "FAILED" } }),
      prisma.listingPromotion.update({ where: { id: promotion.id }, data: { status: "FAILED" } }),
    ]);
    throw error;
  }
}

export async function redeemPromotionCredit(input: { userId: string; listingId: string; packageSlug: string }) {
  const creditPackageSlug = process.env.PROMOTION_CREDIT_PACKAGE_SLUG || "featured";
  if (input.packageSlug !== creditPackageSlug) return { error: `A subscription credit can only be used for ${creditPackageSlug} promotion` as const, status: 400 as const };
  const [listing, pkg] = await Promise.all([
    prisma.machine.findFirst({ where: { id: input.listingId, sellerId: input.userId, status: "PUBLISHED" }, select: { id: true } }),
    prisma.promotionPackage.findFirst({ where: { slug: input.packageSlug, isActive: true } }),
  ]);
  if (!listing || !pkg) return { error: "Eligible listing or package not found" as const, status: 404 as const };
  const now = new Date();
  const active = await prisma.listingPromotion.findFirst({ where: { listingId: listing.id, status: "ACTIVE", startAt: { lte: now }, endAt: { gt: now } } });
  if (active) return { error: "This listing already has an active promotion" as const, status: 409 as const };
  return prisma.$transaction(async (tx) => {
    await tx.machine.update({ where: { id: listing.id }, data: { updatedAt: new Date() } });
    if (await tx.listingPromotion.findFirst({ where: { listingId: listing.id, status: { in: ["ACTIVE", "PENDING"] } } })) throw new Error("PROMOTION_ALREADY_PENDING");
    const debit = await tx.user.updateMany({ where: { id: input.userId, promotionCreditsBalance: { gte: 1 }, accountStatus: "ACTIVE" }, data: { promotionCreditsBalance: { decrement: 1 } } });
    if (!debit.count) throw new Error("NO_PROMOTION_CREDITS");
    const promotion = await tx.listingPromotion.create({ data: {
      sellerId: input.userId, listingId: listing.id, packageId: pkg.id, packageNameSnapshot: pkg.name,
      priceSnapshot: 0, currencySnapshot: pkg.currency, durationSnapshot: pkg.durationDays,
      prioritySnapshot: pkg.priority, badgeTypeSnapshot: pkg.badgeType, status: "ACTIVE", startAt: now,
      endAt: new Date(now.getTime() + pkg.durationDays * 86_400_000),
    } });
    const ledger = await tx.promotionCreditLedger.create({ data: { sellerId: input.userId, promotionId: promotion.id, listingId: listing.id, type: "USE", amount: 1, reason: `${pkg.name} promotion credit used` } });
    await tx.listingPromotion.update({ where: { id: promotion.id }, data: { creditLedgerId: ledger.id } });
    await tx.financialAuditLog.create({ data: { event: "CREDIT_USED", userId: input.userId, targetId: ledger.id, metadata: { promotionId: promotion.id, listingId: listing.id, packageId: pkg.id } } });
    return { promotion, creditBalance: (await tx.user.findUniqueOrThrow({ where: { id: input.userId }, select: { promotionCreditsBalance: true } })).promotionCreditsBalance };
  }).catch((error) => {
    if (error instanceof Error && error.message === "NO_PROMOTION_CREDITS") return { error: "No promotion credits available" as const, status: 402 as const };
    throw error;
  });
}

export async function expireDuePromotions() {
  return prisma.listingPromotion.updateMany({ where: { status: "ACTIVE", endAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
}

export async function getSellerPromotions(userId: string) {
  await expireDuePromotions();
  return prisma.listingPromotion.findMany({ where: { sellerId: userId }, orderBy: { createdAt: "desc" }, include: { listing: { select: { title: true, slug: true } } }, take: 100 });
}
