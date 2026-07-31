import { z } from "zod";

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(["ALL", "BUYER", "SELLER", "ADMIN"]).default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "BLOCKED", "SUSPENDED"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUserUpdateSchema = z.object({
  accountStatus: z.enum(["ACTIVE", "BLOCKED", "SUSPENDED"]).optional(),
  role: z.enum(["BUYER", "SELLER", "ADMIN"]).optional(),
});

export const adminMachinesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z
    .enum([
      "ALL",
      "DRAFT",
      "PENDING_REVIEW",
      "REJECTED",
      "PUBLISHED",
      "SOLD",
      "ARCHIVED",
    ])
    .default("PENDING_REVIEW"),
  category: z.string().uuid().optional(),
  brand: z.string().uuid().optional(),
  seller: z.string().uuid().optional(),
  featured: z.enum(["ALL", "YES", "NO"]).default("ALL"),
  sort: z.enum(["newest", "oldest", "price_desc", "price_asc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminListingModerationSchema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "archive",
    "mark_sold",
    "feature",
    "unfeature",
  ]),
  rejectionReason: z.string().trim().min(10).max(800).optional(),
  rejectionPreset: z
    .enum([
      "MISSING_INFORMATION",
      "POOR_IMAGE_QUALITY",
      "INCORRECT_CATEGORY",
      "INCORRECT_BRAND",
      "SUSPICIOUS_LISTING",
      "DUPLICATE_LISTING",
      "INAPPROPRIATE_CONTENT",
      "OTHER",
    ])
    .optional(),
});

export const adminMachineUpdateSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "PENDING_REVIEW",
      "REJECTED",
      "PUBLISHED",
      "SOLD",
      "ARCHIVED",
    ])
    .optional(),
  isFeatured: z.boolean().optional(),
});

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const adminBrandSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
});

export const adminReportsQuerySchema = z.object({
  status: z
    .enum(["ALL", "PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"])
    .default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const reportCreateSchema = z.object({
  type: z.enum([
    "FAKE_LISTING",
    "SCAM",
    "INAPPROPRIATE_CONTENT",
    "ABUSIVE_USER",
    "SUSPICIOUS_ACTIVITY",
    "OTHER",
  ]),
  reason: z.string().trim().min(5).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  reportedUserId: z.string().uuid().optional(),
  machineId: z.string().uuid().optional(),
});

export const adminReportUpdateSchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"]),
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const adminReviewsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["ALL", "PUBLISHED", "HIDDEN", "REMOVED"]).default("ALL"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
