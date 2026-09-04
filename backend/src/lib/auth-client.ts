import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { dashboardPathForRole } from "./auth/roles";

export { dashboardPathForRole };

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export function mapAuthError(
  error: { message?: string; code?: string | number } | undefined,
  fallback: string
): string {
  const message = (error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  if (
    code.includes("user_already_exists") ||
    message.includes("already exists") ||
    message.includes("already registered") ||
    message.includes("use another email")
  ) {
    return "Email already exists";
  }

  if (
    code.includes("invalid_email_or_password") ||
    code.includes("invalid_password") ||
    code.includes("invalid_email") ||
    message.includes("invalid email or password") ||
    message.includes("invalid credentials")
  ) {
    return "Invalid email or password";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Unable to reach the server. Please try again.";
  }

  if (error?.message && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
