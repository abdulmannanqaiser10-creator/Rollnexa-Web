import { z } from "zod";

export const reviewCreateSchema = z.object({
  machineId: z.string().uuid("Invalid machine"),
  rating: z.coerce.number().int().min(1, "Rating is required").max(5, "Max 5 stars"),
  content: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(1200, "Review must be at most 1200 characters"),
});

export const reviewCreateClientSchema = z.object({
  machineId: z.string().uuid("Invalid machine"),
  rating: z.number().int().min(1, "Rating is required").max(5, "Max 5 stars"),
  content: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(1200, "Review must be at most 1200 characters"),
});

export const reviewUpdateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  content: z.string().trim().min(10).max(1200).optional(),
});

export const reviewReplySchema = z.object({
  sellerReply: z
    .string()
    .trim()
    .min(2, "Reply is too short")
    .max(800, "Reply is too long"),
});

export const reviewModerationSchema = z.object({
  status: z.enum(["PUBLISHED", "HIDDEN", "REMOVED"]),
  moderationNote: z
    .string()
    .trim()
    .max(500, "Moderation note is too long")
    .optional(),
});
