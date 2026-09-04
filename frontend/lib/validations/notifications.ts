import { z } from "zod";

export const notificationTypeValues = [
  "ALL",
  "NEW_INQUIRY",
  "NEW_MESSAGE",
  "MACHINE_APPROVED",
  "MACHINE_REJECTED",
  "NEW_REVIEW",
  "ACCOUNT_UPDATE",
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_EXPIRING",
  "SUBSCRIPTION_RENEWED",
  "SUBSCRIPTION_EXPIRED",
  "PAYMENT_SUCCESSFUL",
  "PAYMENT_FAILED",
  "INVOICE_READY",
] as const;

export const notificationStatusValues = ["ALL", "UNREAD", "READ"] as const;

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(notificationStatusValues).default("ALL"),
  type: z.enum(notificationTypeValues).default("ALL"),
});
