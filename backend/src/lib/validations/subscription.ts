import { z } from "zod";

export const checkoutSchema = z.object({
  planSlug: z.enum(["basic", "premium", "enterprise"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  provider: z.enum(["manual", "stripe", "paypal", "razorpay", "safepay"]).optional(),
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
  yearlyPrice: z.coerce.number().min(0).nullable().optional(),
  currency: z.string().length(3).default("PKR"),
  durationDays: z.coerce.number().int().min(1).default(30),
  maxListings: z.coerce.number().int().min(0).nullable().optional(),
  featuredListings: z.coerce.number().int().min(0).default(0),
  promotionCredits: z.coerce.number().int().min(0).max(100).default(0),
  homepageFeatured: z.boolean().default(false),
  premiumBadge: z.boolean().default(false),
  analytics: z.boolean().default(false),
  prioritySupport: z.boolean().default(false),
  dealerProfile: z.boolean().default(false),
  topSearchPriority: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const promotionPackageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0),
  currency: z.string().length(3).default("PKR"),
  durationDays: z.coerce.number().int().min(1).max(365),
  priority: z.coerce.number().int().min(1).max(100).default(1),
  placementType: z.string().trim().min(2).max(40).default("SEARCH"),
  badgeType: z.string().trim().min(2).max(30).default("NONE"),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const adminPaymentsQuerySchema = z.object({
  status: z
    .enum(["ALL", "PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"])
    .default("ALL"),
  plan: z.string().optional(),
  q: z.string().optional(),
});
