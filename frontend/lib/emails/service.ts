import "server-only";

import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  renderAnnouncementEmailTemplate,
  renderInquiryEmailTemplate,
  renderListingApprovedEmailTemplate,
  renderListingRejectedEmailTemplate,
  renderMessageEmailTemplate,
  renderPasswordResetEmailTemplate,
  renderPaymentReceiptEmailTemplate,
  renderSubscriptionReminderEmailTemplate,
  renderVerificationEmailTemplate,
  renderWelcomeEmailTemplate,
} from "@/lib/emails/templates";

const APP_NAME = process.env.APP_NAME || "Rollnexa";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

type EmailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

async function sendHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailSendResult> {
  if (!resend) {
    console.warn("[emails] RESEND_API_KEY is not configured; email skipped");
    return { success: false, error: "Resend is not configured" };
  }

  if (!input.to || !input.to.includes("@")) {
    return { success: false, error: "Invalid recipient email" };
  }

  try {
    const response = await resend.emails.send({
      from: `${APP_NAME} <${fromEmail}>`,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text || input.subject,
    });

    if (response.error) {
      console.error("[emails] send failed", response.error);
      return { success: false, error: response.error.message || "Email delivery failed" };
    }

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected email error";
    console.error("[emails] unexpected failure", message);
    return { success: false, error: message };
  }
}

function getDisplayName(user: { name?: string | null } | null | undefined, fallback: string) {
  const candidate = user?.name?.trim();
  return candidate && candidate.length > 0 ? candidate : fallback;
}

export async function sendWelcomeEmail(input: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user?.email) return { success: false, error: "User not found" };

  const html = renderWelcomeEmailTemplate({
    userName: user.name || "there",
    accountType: user.role === "SELLER" ? "seller" : "buyer",
  });

  return sendHtmlEmail({
    to: user.email,
    subject: `Welcome to ${APP_NAME}`,
    html,
    text: `Welcome to ${APP_NAME}. Your account is ready.`,
  });
}

export async function sendVerificationEmail(input: {
  userId: string;
  verificationUrl: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user?.email) return { success: false, error: "User not found" };

  const html = renderVerificationEmailTemplate({
    userName: user.name || "there",
    verificationUrl: input.verificationUrl,
  });

  return sendHtmlEmail({
    to: user.email,
    subject: `Verify your ${APP_NAME} account`,
    html,
    text: `Verify your ${APP_NAME} account using the secure link provided.`,
  });
}

export async function sendPasswordResetEmail(input: {
  userId: string;
  resetUrl: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user?.email) return { success: false, error: "User not found" };

  const html = renderPasswordResetEmailTemplate({
    userName: user.name || "there",
    resetUrl: input.resetUrl,
  });

  return sendHtmlEmail({
    to: user.email,
    subject: `Reset your ${APP_NAME} password`,
    html,
    text: `Reset your ${APP_NAME} password with the secure link provided.`,
  });
}

export async function sendInquiryEmail(input: {
  sellerId: string;
  buyerId: string;
  machineName: string;
  replyUrl: string;
}) {
  const [seller, buyer] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.sellerId }, select: { id: true, name: true, email: true } }),
    prisma.user.findUnique({ where: { id: input.buyerId }, select: { id: true, name: true, email: true } }),
  ]);

  if (!seller?.email || !buyer) return { success: false, error: "Recipient or sender not found" };

  const html = renderInquiryEmailTemplate({
    sellerName: getDisplayName(seller, "seller"),
    buyerName: getDisplayName(buyer, "buyer"),
    machineName: input.machineName,
    message: "A new inquiry was submitted for your listing.",
    replyUrl: input.replyUrl,
  });

  return sendHtmlEmail({
    to: seller.email,
    subject: `New inquiry for ${input.machineName}`,
    html,
    text: `A new inquiry was submitted for ${input.machineName}.`,
  });
}

export async function sendMessageEmail(input: {
  recipientId: string;
  senderId: string;
  preview: string;
  conversationUrl: string;
}) {
  const [recipient, sender] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.recipientId }, select: { id: true, name: true, email: true } }),
    prisma.user.findUnique({ where: { id: input.senderId }, select: { id: true, name: true, email: true } }),
  ]);

  if (!recipient?.email || !sender) return { success: false, error: "Recipient or sender not found" };

  const html = renderMessageEmailTemplate({
    recipientName: getDisplayName(recipient, "there"),
    senderName: getDisplayName(sender, "someone"),
    preview: input.preview,
    conversationUrl: input.conversationUrl,
  });

  return sendHtmlEmail({
    to: recipient.email,
    subject: `${APP_NAME} — New message`,
    html,
    text: `You received a new message from ${sender.name || "someone"}.`,
  });
}

export async function sendListingApprovedEmail(input: {
  sellerId: string;
  machineName: string;
  listingUrl: string;
}) {
  const seller = await prisma.user.findUnique({
    where: { id: input.sellerId },
    select: { id: true, name: true, email: true },
  });

  if (!seller?.email) return { success: false, error: "Seller not found" };

  const html = renderListingApprovedEmailTemplate({
    sellerName: getDisplayName(seller, "seller"),
    machineName: input.machineName,
    listingUrl: input.listingUrl,
  });

  return sendHtmlEmail({
    to: seller.email,
    subject: `${APP_NAME} — Listing approved`,
    html,
    text: `Your listing ${input.machineName} has been approved.`,
  });
}

export async function sendListingRejectedEmail(input: {
  sellerId: string;
  machineName: string;
  rejectionReason: string;
  editUrl: string;
}) {
  const seller = await prisma.user.findUnique({
    where: { id: input.sellerId },
    select: { id: true, name: true, email: true },
  });

  if (!seller?.email) return { success: false, error: "Seller not found" };

  const html = renderListingRejectedEmailTemplate({
    sellerName: getDisplayName(seller, "seller"),
    machineName: input.machineName,
    rejectionReason: input.rejectionReason,
    editUrl: input.editUrl,
  });

  return sendHtmlEmail({
    to: seller.email,
    subject: `${APP_NAME} — Listing requires updates`,
    html,
    text: `Your listing ${input.machineName} was rejected.`,
  });
}

export async function sendPaymentReceiptEmail(input: {
  sellerId: string;
  transactionId: string;
  invoiceNumber: string;
  planName: string;
  amount: string;
  paymentDate: string;
  receiptUrl: string;
}) {
  const seller = await prisma.user.findUnique({
    where: { id: input.sellerId },
    select: { id: true, name: true, email: true },
  });

  if (!seller?.email) return { success: false, error: "Seller not found" };

  const html = renderPaymentReceiptEmailTemplate({
    sellerName: getDisplayName(seller, "seller"),
    transactionId: input.transactionId,
    invoiceNumber: input.invoiceNumber,
    planName: input.planName,
    amount: input.amount,
    paymentDate: input.paymentDate,
    receiptUrl: input.receiptUrl,
  });

  return sendHtmlEmail({
    to: seller.email,
    subject: `${APP_NAME} — Payment receipt`,
    html,
    text: `Your payment receipt for ${input.planName} is ready.`,
  });
}

export async function sendSubscriptionReminderEmail(input: {
  sellerId: string;
  planName: string;
  expiryDate: string;
  renewUrl: string;
}) {
  const seller = await prisma.user.findUnique({
    where: { id: input.sellerId },
    select: { id: true, name: true, email: true },
  });

  if (!seller?.email) return { success: false, error: "Seller not found" };

  const html = renderSubscriptionReminderEmailTemplate({
    sellerName: getDisplayName(seller, "seller"),
    planName: input.planName,
    expiryDate: input.expiryDate,
    renewUrl: input.renewUrl,
  });

  return sendHtmlEmail({
    to: seller.email,
    subject: `${APP_NAME} — Subscription expiring soon`,
    html,
    text: `Your ${input.planName} subscription is expiring soon.`,
  });
}

export async function sendAnnouncementEmail(input: {
  recipientIds?: string[];
  recipientEmails?: string[];
  title: string;
  description: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const recipients = [...(input.recipientEmails || [])];

  if (input.recipientIds?.length) {
    const users = await prisma.user.findMany({
      where: { id: { in: input.recipientIds } },
      select: { id: true, name: true, email: true },
    });
    users.forEach((user) => {
      if (user.email && !recipients.includes(user.email)) recipients.push(user.email);
    });
  }

  if (!recipients.length) return { success: false, error: "No recipients found" };

  const results = await Promise.allSettled(
    recipients.map((email) =>
      sendHtmlEmail({
        to: email,
        subject: input.title,
        html: renderAnnouncementEmailTemplate({
          recipientName: email.split("@")[0] || "there",
          title: input.title,
          description: input.description,
          ctaLabel: input.ctaLabel || "Read more",
          ctaUrl: input.ctaUrl || `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}`,
        }),
        text: input.description,
      })
    )
  );

  const successful = results.filter((result) => result.status === "fulfilled" && result.value.success).length;
  return { success: successful > 0, messageId: `batch:${successful}` };
}

export async function sendEmailPreview(input: {
  to: string;
  type: "welcome" | "verification" | "reset" | "announcement";
  data?: Record<string, unknown>;
}) {
  const safeTo = input.to.replace(/\s+/g, "").trim();
  if (!safeTo) return { success: false, error: "Invalid recipient" };

  switch (input.type) {
    case "welcome":
      return sendHtmlEmail({
        to: safeTo,
        subject: "Preview welcome email",
        html: renderWelcomeEmailTemplate({ userName: String((input.data?.userName as string) || "there"), accountType: String((input.data?.accountType as string) || "BUYER") }),
      });
    case "verification":
      return sendHtmlEmail({
        to: safeTo,
        subject: "Preview verification email",
        html: renderVerificationEmailTemplate({ userName: String((input.data?.userName as string) || "there"), verificationUrl: String((input.data?.verificationUrl as string) || `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}/verify-email`) }),
      });
    case "reset":
      return sendHtmlEmail({
        to: safeTo,
        subject: "Preview password reset email",
        html: renderPasswordResetEmailTemplate({ userName: String((input.data?.userName as string) || "there"), resetUrl: String((input.data?.resetUrl as string) || `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}/forgot-password`) }),
      });
    case "announcement":
      return sendHtmlEmail({
        to: safeTo,
        subject: String((input.data?.title as string) || "Preview announcement"),
        html: renderAnnouncementEmailTemplate({ recipientName: String((input.data?.recipientName as string) || "there"), title: String((input.data?.title as string) || "Preview announcement"), description: String((input.data?.description as string) || "This is a preview email"), ctaLabel: String((input.data?.ctaLabel as string) || "Read more"), ctaUrl: String((input.data?.ctaUrl as string) || `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}`) }),
      });
    default:
      return { success: false, error: "Unsupported preview type" };
  }
}
