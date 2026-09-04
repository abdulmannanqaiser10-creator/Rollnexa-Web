import { z } from "zod";

export const inquiryCreateSchema = z.object({
  machineId: z.string().uuid("Invalid machine"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long"),
});

export const favoriteToggleSchema = z.object({
  machineId: z.string().uuid("Invalid machine"),
});

export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;
export type FavoriteToggleInput = z.infer<typeof favoriteToggleSchema>;
