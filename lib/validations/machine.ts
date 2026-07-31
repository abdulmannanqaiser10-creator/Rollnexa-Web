import { z } from "zod";

const currentYear = new Date().getFullYear();

export const machineConditionValues = ["NEW", "USED", "REFURBISHED"] as const;

export const machineListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  model: z
    .string()
    .trim()
    .max(80, "Model must be at most 80 characters")
    .optional()
    .or(z.literal("")),
  year: z.coerce
    .number({ error: "Manufacturing year is required" })
    .int("Year must be a whole number")
    .min(1950, "Year must be 1950 or later")
    .max(currentYear, `Year cannot be later than ${currentYear}`),
  condition: z.enum(machineConditionValues, {
    error: "Please select a valid condition",
  }),
  hours: z.coerce
    .number({ error: "Engine hours must be a number" })
    .int("Engine hours must be a whole number")
    .min(0, "Engine hours cannot be negative")
    .max(500000, "Engine hours value is too high"),
  price: z.coerce
    .number({ error: "Price is required" })
    .positive("Price must be greater than zero")
    .max(100_000_000, "Price value is too high"),
  location: z
    .string()
    .trim()
    .min(2, "Location is required")
    .max(120, "Location must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be at most 5000 characters"),
  images: z
    .array(
      z.object({
        url: z
          .string()
          .trim()
          .min(1, "Invalid image URL")
          .refine(
            (value) =>
              value.startsWith("/") ||
              value.startsWith("http://") ||
              value.startsWith("https://"),
            "Invalid image URL"
          ),
        publicId: z.string().optional().nullable(),
        alt: z.string().optional().nullable(),
        id: z.string().optional().nullable(),
      })
    )
    .max(8, "You can upload up to 8 images")
    .default([]),
  status: z.enum(["DRAFT"]).default("DRAFT"),
});

export type MachineListingInput = z.infer<typeof machineListingSchema>;

export const MACHINE_IMAGE_LIMITS = {
  maxFiles: 8,
  maxBytes: 5 * 1024 * 1024,
  accept: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
} as const;
