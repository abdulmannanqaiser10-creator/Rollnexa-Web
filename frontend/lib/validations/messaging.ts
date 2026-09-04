import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 4000;
export const MESSAGE_MIN_LENGTH = 1;

export const openConversationSchema = z.object({
  machineId: z.string().uuid("Invalid machine"),
  message: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z
      .string()
      .min(MESSAGE_MIN_LENGTH, "Message cannot be empty")
      .max(MESSAGE_MAX_LENGTH, "Message is too long")
      .optional()
  ),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(MESSAGE_MIN_LENGTH, "Message cannot be empty")
    .max(MESSAGE_MAX_LENGTH, "Message is too long"),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentType: z.string().max(80).optional().nullable(),
});

export type OpenConversationInput = z.infer<typeof openConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
