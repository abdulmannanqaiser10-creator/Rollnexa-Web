import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { dashboardPathForRole } from "./auth/roles";

export { dashboardPathForRole };

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

/**
 * Better Auth returns `{ code, message }`, `@better-fetch` adds `status`, and
 * the proxy guard in frontend/proxy.ts replies with `{ error: "..." }` instead.
 * Error instances keep `message` non-enumerable, so only direct property reads
 * are reliable — never a spread or `JSON.stringify`.
 */
type NestedAuthError = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  error?: unknown;
};

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function readAuthError(error: unknown): {
  message: string;
  code: string;
  status: number;
} {
  const outer = (error ?? {}) as NestedAuthError;
  const inner =
    typeof outer.error === "object" && outer.error !== null
      ? (outer.error as NestedAuthError)
      : undefined;
  const nestedText = typeof outer.error === "string" ? outer.error : "";

  return {
    message: asText(outer.message) || nestedText || asText(inner?.message),
    code: asText(outer.code) || asText(inner?.code),
    status: Number(outer.status ?? inner?.status ?? 0) || 0,
  };
}

/**
 * One-line, always-serializable summary for `console.error`. Next.js dev
 * forwards browser logs to the terminal, where a plain object argument prints
 * as `{}` and hides the real reason.
 */
export function describeAuthError(error: unknown): string {
  const { message, code, status } = readAuthError(error);
  const parts = [
    code ? `code=${code}` : "",
    status ? `status=${status}` : "",
    message ? `message=${message}` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "error carried no code, message or status";
}

/**
 * A rejected request the visitor can act on themselves (email taken, wrong
 * password, rate limited). Server and transport failures are not expected and
 * must stay on `console.error`.
 */
export function isExpectedAuthError(error: unknown): boolean {
  const { message, code, status } = readAuthError(error);
  if (status === 0 || status >= 500) return false;
  return status >= 400 && (code.length > 0 || message.length > 0);
}

function matchesDuplicateEmail(error: unknown): boolean {
  const { message, code } = readAuthError(error);
  const haystack = message.toLowerCase();
  const codeKey = code.toLowerCase();

  return (
    codeKey.includes("user_already_exists") ||
    haystack.includes("already exists") ||
    haystack.includes("already registered") ||
    haystack.includes("use another email")
  );
}

/** Duplicated sign-up is expected traffic, so it gets its own copy and a route to login. */
export const DUPLICATE_EMAIL_MESSAGE =
  "This email is already registered. Please log in instead.";

export function isDuplicateEmailError(error: unknown): boolean {
  return matchesDuplicateEmail(error);
}

export function mapAuthError(
  error: { message?: string; code?: string | number } | undefined,
  fallback: string
): string {
  const { message, code, status } = readAuthError(error);

  if (matchesDuplicateEmail(error)) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  const haystack = message.toLowerCase();
  const codeKey = code.toLowerCase();

  if (
    codeKey.includes("invalid_email_or_password") ||
    codeKey.includes("invalid_password") ||
    codeKey.includes("invalid_email") ||
    haystack.includes("invalid email or password") ||
    haystack.includes("invalid credentials")
  ) {
    return "Invalid email or password";
  }

  if (
    codeKey.includes("invalid_token") ||
    haystack.includes("invalid token")
  ) {
    return "This reset link is invalid or has already been used. Please request a new one.";
  }

  if (
    codeKey.includes("account_not_linked") ||
    haystack.includes("account not linked") ||
    haystack.includes("already linked")
  ) {
    return "This email is already registered. Please sign in with your password first, then link your social account from profile settings.";
  }

  if (haystack.includes("network") || haystack.includes("fetch")) {
    return "Unable to reach the server. Please try again.";
  }

  // Better Auth wraps any insert failure — including the unique-email race when
  // two sign-ups for the same address overlap — in this code, so it can't be shown raw.
  if (codeKey.includes("failed_to_create_user")) {
    return "We couldn't create your account. Please try again.";
  }

  if (message.trim().length > 0) {
    return message;
  }

  if (status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  if (status >= 500) {
    return "A server error occurred. Please try again.";
  }

  return fallback;
}
