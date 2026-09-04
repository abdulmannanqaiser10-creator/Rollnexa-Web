import { z } from "zod";

export const sellerMachineStatusValues = [
  "ALL",
  "DRAFT",
  "PENDING_REVIEW",
  "REJECTED",
  "PUBLISHED",
  "SOLD",
  "ARCHIVED",
] as const;

export const sellerMachineSortValues = [
  "newest",
  "oldest",
  "price_desc",
  "price_asc",
  "title_asc",
  "title_desc",
] as const;

export const sellerMachinesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(sellerMachineStatusValues).default("ALL"),
  category: z.string().uuid().optional(),
  sort: z.enum(sellerMachineSortValues).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type SellerMachinesQueryInput = z.infer<
  typeof sellerMachinesQuerySchema
>;
