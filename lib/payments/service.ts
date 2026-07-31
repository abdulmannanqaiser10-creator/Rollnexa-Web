import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/service";
import { activateSubscriptionFromPayment } from "@/lib/subscriptions/service";
import { getPlanBySlug } from "@/lib/subscriptions/plans";
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
}) {
  const plan = await getPlanBySlug(input.planSlug);
  if (!plan) {
    return { error: "Plan not found" as const, status: 404 as const };
  }

  if (plan.slug === "free") {
    return { error: "Free plan does not require checkout" as const, status: 400 as const };
  }

  const providerId = input.provider ?? getDefaultPaymentProviderId();
  const provider = getPaymentProvider(providerId);
  const paymentId = generatePaymentId();

  const payment = await prisma.payment.create({
    data: {
      paymentId,
      userId: input.userId,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      paymentMethod: input.paymentMethod ?? "CARD",
      paymentProvider: providerId.toUpperCase() as "MANUAL" | "STRIPE" | "PAYPAL" | "RAZORPAY",
      paymentStatus: "PENDING",
      invoiceNumber: generateInvoiceNumber(),
      metadata: { renew: input.renew ?? false },
    },
    include: { plan: true },
  });

  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const session = await provider.createCheckoutSession({
    paymentId: payment.id,
    userId: input.userId,
    planSlug: plan.slug,
    amount: plan.price,
    currency: plan.currency,
    successUrl: `${baseUrl}/seller/subscription/success?payment=${payment.id}`,
    cancelUrl: `${baseUrl}/seller/subscription/failed?payment=${payment.id}`,
    metadata: { renew: String(input.renew ?? false) },
  });

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

  if (payment.paymentStatus === "SUCCESS") {
    return { payment, alreadyCompleted: true as const };
  }

  if (payment.paymentStatus === "FAILED" || payment.paymentStatus === "CANCELLED") {
    return { error: "Payment is not payable" as const, status: 400 as const };
  }

  const providerId = resolveProviderId(payment.paymentProvider.toLowerCase());
  const provider = getPaymentProvider(providerId);

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

  const renew = Boolean(
    payment.metadata &&
      typeof payment.metadata === "object" &&
      "renew" in payment.metadata &&
      (payment.metadata as { renew?: boolean }).renew
  );

  const paidAt = new Date();

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      paymentStatus: "SUCCESS",
      transactionId: verification.transactionId ?? payment.transactionId,
      receiptUrl: verification.receiptUrl ?? payment.receiptUrl,
      paidAt,
    },
  });

  await activateSubscriptionFromPayment({
    userId: payment.userId,
    planId: payment.planId,
    paymentId: payment.id,
    renew,
  });

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

  return { payment, success: true as const };
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
