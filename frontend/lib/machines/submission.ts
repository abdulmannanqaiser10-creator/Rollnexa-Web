import type { MachineListingInput } from "@/lib/validations/machine";
import { machineListingSchema } from "@/lib/validations/machine";

export function validateListingForSubmission(input: MachineListingInput) {
  const parsed = machineListingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || "Invalid listing data",
    };
  }

  if (parsed.data.images.length < 1) {
    return {
      ok: false as const,
      error: "At least one machine image is required before submitting for approval.",
    };
  }

  return { ok: true as const, data: parsed.data };
}
