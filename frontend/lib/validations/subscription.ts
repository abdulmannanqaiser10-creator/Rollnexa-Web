import { z } from "zod";

export const checkoutSchema = z.object({
  planSlug: z.enum(["basic", "premium", "enterprise"]),
  provider: z.enum(["manual", "stripe", "paypal", "razorpay"]).optional(),
  paymentMethod: z
    .enum(["CARD", "DEBIT_CARD", "WALLET", "BANK_TRANSFER", "OTHER"])
    .optional(),
  renew: z.boolean().optional(),
});

export const adminPlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  currency: z.string().min(3).max(3).default("USD"),
  durationDays: z.coerce.number().int().min(1).default(30),
  maxListings: z.coerce.number().int().min(0).nullable().optional(),
  featuredListings: z.coerce.number().int().min(0).default(0),
  homepageFeatured: z.boolean().default(false),
  premiumBadge: z.boolean().default(false),
  analytics: z.boolean().default(false),
  prioritySupport: z.boolean().default(false),
  dealerProfile: z.boolean().default(false),
  topSearchPriority: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const adminPaymentsQuerySchema = z.object({
  status: z
    .enum(["ALL", "PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"])
    .default("ALL"),
  plan: z.string().optional(),
  q: z.string().optional(),
});
