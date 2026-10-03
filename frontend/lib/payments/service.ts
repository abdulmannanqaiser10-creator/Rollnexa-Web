import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "../db";
import { createNotification } from "../notifications/service";
import { sendPaymentReceiptEmail } from "../emails/service";
import { getPlanBySlug } from "../subscriptions/plans";
import {
  getDefaultPaymentProviderId,
  getPaymentProvider,
  resolveProviderId,
} from "./registry";
import type { PaymentProviderId } from "./types";

function generatePaymentId() {
  return `pay_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function generateInvoiceNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${stamp}-${suffix}`;
}

export async function createSubscriptionCheckout(input: {
  userId: string;
  planSlug: string;
  provider?: PaymentProviderId;
  paymentMethod?: "CARD" | "DEBIT_CARD" | "WALLET" | "BANK_TRANSFER" | "OTHER";
  renew?: boolean;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  billingCycle?: "MONTHLY" | "YEARLY";
}) {
  const plan = await getPlanBySlug(input.planSlug);
  if (!plan) {
    return { error: "Plan not found" as const, status: 404 as const };
  }

  if (plan.slug === "free") {
    return { error: "Free plan does not require checkout" as const, status: 400 as const };
  }

  const providerId = input.provider ?? getDefaultPaymentProviderId();
  if (providerId !== "safepay") {
    return { error: "This payment provider is not configured for verified checkout. Configure Safepay merchant credentials to accept payments." as const, status: 503 as const };
  }
  if (providerId === "safepay" && plan.currency !== "PKR") {
    return { error: "Safepay checkout requires plans priced in PKR" as const, status: 400 as const };
  }
  const provider = getPaymentProvider(providerId);
  const billingCycle = input.billingCycle ?? "MONTHLY";
  if (billingCycle === "YEARLY" && plan.yearlyPrice == null) return { error: "Yearly billing is not configured for this plan" as const, status: 400 as const };
  const amount = billingCycle === "YEARLY" ? plan.yearlyPrice! : plan.price;
  const paymentId = generatePaymentId();

  const payment = await prisma.payment.create({
    data: {
      paymentId,
      userId: input.userId,
      planId: plan.id,
      amount,
      currency: plan.currency,
      paymentMethod: input.paymentMethod ?? "CARD",
      paymentProvider: providerId.toUpperCase() as "MANUAL" | "STRIPE" | "PAYPAL" | "RAZORPAY" | "SAFEPAY",
      paymentStatus: "PENDING",
      invoiceNumber: generateInvoiceNumber(),
      metadata: { renew: input.renew ?? false, billingCycle, customerEmail: input.customerEmail ?? "", customerPhone: input.customerPhone ?? "", customerName: input.customerName ?? "" },
    },
    include: { plan: true },
  });

  const baseUrl = process.env.APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  let session;
  try {
    session = await provider.createCheckoutSession({
    paymentId: payment.id,
    userId: input.userId,
    planSlug: plan.slug,
    amount,
    currency: plan.currency,
    // Safepay appends its order_id to redirect URLs. Keep these URLs free of
    // query strings so the returned order_id is parsed as its own parameter.
    successUrl: `${baseUrl}/seller/subscription/success`,
    cancelUrl: `${baseUrl}/seller/subscription/failed`,
    metadata: { renew: String(input.renew ?? false), billingCycle, customerEmail: input.customerEmail ?? "", customerPhone: input.customerPhone ?? "", customerName: input.customerName ?? "", internalPaymentReference: payment.id },
    });
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { paymentStatus: "FAILED" } });
    throw error;
  }

  return {
    payment,
    session,
  };
}

export async function completePayment(input: {
  paymentDbId: string;
  userId: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentDbId },
    include: { plan: true },
  });

  if (!payment || payment.userId !== input.userId) {
    return { error: "Payment not found" as const, status: 404 as const };
  }

  if (payment.paymentStatus === "SUCCESS") return { payment, alreadyCompleted: true as const };

  if (payment.paymentStatus === "FAILED" || payment.paymentStatus === "CANCELLED") {
    return { error: "Payment is not payable" as const, status: 400 as const };
  }

  const providerId = resolveProviderId(payment.paymentProvider.toLowerCase());
  const provider = getPaymentProvider(providerId);

  if (payment.paymentStatus === "PROCESSING") {
    return { error: "Payment verification is already in progress" as const, status: 409 as const };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { paymentStatus: "PROCESSING" },
  });

  const verification = await provider.verifyPayment(payment.paymentId);

  if (!verification.success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { paymentStatus: "FAILED" },
    });

    await createNotification({
      userId: payment.userId,
      type: "PAYMENT_FAILED",
      title: "Payment failed",
      message: verification.failureReason || "Your payment could not be processed.",
      relatedEntityId: payment.id,
      relatedEntityType: "PAYMENT",
    });

    return { error: "Payment verification failed" as const, status: 402 as const };
  }

  return finalizeVerifiedPayment(payment, verification);
}

type PaymentWithPlan = NonNullable<Awaited<ReturnType<typeof prisma.payment.findUnique<{ where: { id: string }; include: { plan: true } }>>>>;

async function finalizeVerifiedPayment(
  payment: PaymentWithPlan,
  verification: { success: boolean; transactionId?: string; receiptUrl?: string }
) {
  const renew = Boolean(
    payment.metadata &&
      typeof payment.metadata === "object" &&
      "renew" in payment.metadata &&
      (payment.metadata as { renew?: boolean }).renew
  );
  const billingCycle = payment.metadata && typeof payment.metadata === "object" && "billingCycle" in payment.metadata && payment.metadata.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY";

  const paidAt = new Date();

  const transitioned = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: payment.id, paymentStatus: { in: ["PENDING", "PROCESSING"] } },
      data: {
        paymentStatus: "SUCCESS",
        transactionId: verification.transactionId ?? payment.transactionId,
        receiptUrl: verification.receiptUrl ?? payment.receiptUrl,
        paidAt,
      },
    });
    if (result.count === 0) return false;
    await tx.financialAuditLog.create({ data: { event: "PAYMENT_VERIFIED", userId: payment.userId, targetId: payment.id, metadata: { paymentId: payment.paymentId, amount: payment.amount, currency: payment.currency, provider: payment.paymentProvider } } });
    const now = new Date();
    const existingActive = await tx.userSubscription.findFirst({ where: { userId: payment.userId, status: "ACTIVE" }, include: { plan: true }, orderBy: { createdAt: "desc" } });
    if (existingActive && !renew) await tx.userSubscription.update({ where: { id: existingActive.id }, data: { status: "EXPIRED" } });
    const startDate = renew && existingActive?.expiryDate && existingActive.expiryDate > now ? existingActive.expiryDate : now;
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + payment.plan.durationDays * (billingCycle === "YEARLY" ? 12 : 1));
    const subscription = await tx.userSubscription.create({ data: {
      userId: payment.userId, planId: payment.planId, status: "ACTIVE", startDate, billingCycle,
      expiryDate: payment.plan.slug === "free" ? null : expiryDate,
      remainingListings: payment.plan.maxListings, autoRenew: false,
    } });
    await tx.payment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } });
    await tx.financialAuditLog.create({ data: { event: renew ? "SUBSCRIPTION_RENEWED" : "SUBSCRIPTION_ACTIVATED", userId: payment.userId, targetId: subscription.id, metadata: { planId: payment.planId, paymentId: payment.id, billingCycle } } });
    if (payment.plan.dealerProfile) await tx.profile.upsert({ where: { userId: payment.userId }, create: { userId: payment.userId, isDealerProfile: true }, update: { isDealerProfile: true } });
    if (payment.plan.promotionCredits > 0) {
      const creditAccount = await tx.user.findUnique({ where: { id: payment.userId }, select: { promotionCreditsBalance: true } });
      if (creditAccount?.promotionCreditsBalance) {
        await tx.user.update({ where: { id: payment.userId }, data: { promotionCreditsBalance: 0 } });
        await tx.promotionCreditLedger.create({ data: { sellerId: payment.userId, subscriptionId: subscription.id, type: "EXPIRE", amount: creditAccount.promotionCreditsBalance, reason: "Unused credits expired at the start of a new billing cycle" } });
      }
      await tx.user.update({ where: { id: payment.userId }, data: { promotionCreditsBalance: { increment: payment.plan.promotionCredits } } });
      const grant = await tx.promotionCreditLedger.create({ data: {
        sellerId: payment.userId, subscriptionId: subscription.id, type: "GRANT", amount: payment.plan.promotionCredits,
        billingCycleReference: `${subscription.id}:${startDate.toISOString()}`, reason: `Credits granted for ${payment.plan.name} subscription`,
      } });
      await tx.financialAuditLog.create({ data: { event: "CREDIT_GRANTED", userId: payment.userId, targetId: grant.id, metadata: { subscriptionId: subscription.id, amount: payment.plan.promotionCredits } } });
    }
    return true;
  });
  if (!transitioned) return { payment: await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }), alreadyCompleted: true as const };

  const updatedPayment = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  await createNotification({
    userId: payment.userId,
    type: "PAYMENT_SUCCESSFUL",
    title: "Payment successful",
    message: `Your payment for ${payment.plan.name} was successful.`,
    relatedEntityId: payment.id,
    relatedEntityType: "PAYMENT",
  });

  await createNotification({
    userId: payment.userId,
    type: "INVOICE_READY",
    title: "Invoice ready",
    message: `Invoice ${payment.invoiceNumber} is available in your payment history.`,
    relatedEntityId: payment.id,
    relatedEntityType: "PAYMENT",
  });

  try {
    await sendPaymentReceiptEmail({
      sellerId: payment.userId,
      transactionId: verification.transactionId ?? payment.transactionId ?? payment.paymentId,
      invoiceNumber: payment.invoiceNumber ?? "N/A",
      planName: payment.plan.name,
      amount: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: payment.currency || "USD",
      }).format(payment.amount),
      paymentDate: paidAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      receiptUrl: verification.receiptUrl || `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}/seller/payments`,
    });
  } catch (error) {
    console.error("[payments] receipt email failed", error);
  }

  return { payment: updatedPayment, success: true as const };
}

export async function completeSafepayWebhook(request: Request) {
  const provider = getPaymentProvider("safepay");
  const event = await provider.verifyWebhook!(request);
  const payment = await prisma.payment.findFirst({ where: { OR: [{ id: event.paymentId }, { paymentId: event.paymentId }] }, include: { plan: true } });
  if (!payment || payment.paymentProvider !== "SAFEPAY") return { error: "Payment not found" as const, status: 404 as const };
  if (payment.paymentStatus === "SUCCESS") return { success: true as const, alreadyCompleted: true as const };
  const amountMatches = "amount" in event && typeof event.amount === "number" && Math.abs(event.amount - payment.amount) < 0.01;
  const currencyMatches = "currency" in event && event.currency === payment.currency;
  if (!event.success || !amountMatches || !currencyMatches) {
    await prisma.$transaction(async (tx) => {
      const failed = await tx.payment.updateMany({ where: { id: payment.id, paymentStatus: { in: ["PENDING", "PROCESSING"] } }, data: { paymentStatus: "FAILED" } });
      if (failed.count) {
        if (payment.metadata && typeof payment.metadata === "object" && "purpose" in payment.metadata && payment.metadata.purpose === "LISTING_PROMOTION") await tx.listingPromotion.updateMany({ where: { paymentId: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
        await tx.financialAuditLog.create({ data: { event: "PAYMENT_FAILED", userId: payment.userId, targetId: payment.id, metadata: { paymentId: payment.paymentId, reason: !event.success ? "provider_failed" : !amountMatches ? "amount_mismatch" : "currency_mismatch" } } });
      }
    });
    return { success: true as const };
  }
  if (payment.metadata && typeof payment.metadata === "object" && "purpose" in payment.metadata && payment.metadata.purpose === "LISTING_PROMOTION") {
    const meta = payment.metadata as { listingId?: string; packageId?: string; packageName?: string; durationDays?: number; priority?: number; badgeType?: string };
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const transition = await tx.payment.updateMany({ where: { id: payment.id, paymentStatus: { in: ["PENDING", "PROCESSING"] } }, data: { paymentStatus: "SUCCESS", transactionId: event.transactionId, paidAt: now } });
      if (!transition.count) return;
      await tx.financialAuditLog.create({ data: { event: "PAYMENT_VERIFIED", userId: payment.userId, targetId: payment.id, metadata: { paymentId: payment.paymentId, amount: payment.amount, currency: payment.currency, provider: payment.paymentProvider } } });
      if (!meta.listingId || !meta.packageId || !meta.packageName || !meta.durationDays || !meta.priority) throw new Error("Promotion payment metadata is incomplete");
      const listing = await tx.machine.findFirst({ where: { id: meta.listingId, sellerId: payment.userId, status: "PUBLISHED" }, select: { id: true } });
      const pendingPromotion = await tx.listingPromotion.findFirst({ where: { paymentId: payment.id, sellerId: payment.userId, listingId: meta.listingId, status: "PENDING" } });
      if (!listing || !pendingPromotion || pendingPromotion.packageId !== meta.packageId || pendingPromotion.priceSnapshot !== payment.amount || pendingPromotion.currencySnapshot !== payment.currency) throw new Error("Promotion order no longer matches");
      const endAt = new Date(now); endAt.setDate(endAt.getDate() + meta.durationDays);
      const promotion = await tx.listingPromotion.update({ where: { id: pendingPromotion.id }, data: { status: "ACTIVE", startAt: now, endAt } });
      await tx.financialAuditLog.create({ data: { event: "PROMOTION_ACTIVATED", userId: payment.userId, targetId: promotion.id, metadata: { paymentId: payment.id, listingId: listing.id, packageId: promotion.packageId } } });
      await tx.payment.update({ where: { id: payment.id }, data: { metadata: { ...(payment.metadata as Record<string, unknown>), promotionId: promotion.id } } });
    });
    return { success: true as const };
  }
  await finalizeVerifiedPayment(payment, { success: true, transactionId: event.transactionId });
  return { success: true as const };
}

export async function getSellerPayments(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      plan: { select: { name: true, slug: true } },
    },
    take: 50,
  });
}

export async function getPaymentForUser(paymentId: string, userId: string) {
  return prisma.payment.findFirst({
    where: { id: paymentId, userId },
    include: {
      plan: true,
      subscription: true,
    },
  });
}

export async function listAdminPayments(filters?: {
  status?: string;
  planSlug?: string;
  q?: string;
}) {
  return prisma.payment.findMany({
    where: {
      ...(filters?.status && filters.status !== "ALL"
        ? { paymentStatus: filters.status as "PENDING" }
        : {}),
      ...(filters?.planSlug
        ? { plan: { slug: filters.planSlug } }
        : {}),
      ...(filters?.q
        ? {
            OR: [
              { paymentId: { contains: filters.q, mode: "insensitive" } },
              { transactionId: { contains: filters.q, mode: "insensitive" } },
              { invoiceNumber: { contains: filters.q, mode: "insensitive" } },
              { user: { email: { contains: filters.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      plan: { select: { name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    take: 100,
  });
}
