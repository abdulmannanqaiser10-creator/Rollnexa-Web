import { passwordSchema } from "@/lib/validations/auth";

/**
 * Endpoints that *set* a new password must enforce the full password policy.
 * Better Auth itself only checks length, so the client-side Zod rules have to
 * be repeated here — otherwise a direct `fetch` bypasses them entirely.
 *
 * Sign-in is deliberately excluded: existing accounts must still be able to
 * log in with the password they chose when the rules were weaker.
 */
const PASSWORD_FIELD_BY_PATH: Record<string, string> = {
  "/api/auth/sign-up/email": "password",
  "/api/auth/reset-password": "newPassword",
  "/api/auth/change-password": "newPassword",
};

async function readBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") || "";
  const clone = request.clone();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await clone.text();
    return Object.fromEntries(new URLSearchParams(text));
  }
  return await clone.json();
}

/**
 * Returns a 400 response when the submitted password violates the policy,
 * otherwise `null`. Safe to call for every request: it only inspects the
 * allow-listed endpoints above.
 */
export async function enforcePasswordPolicy(
  request: Request
): Promise<Response | null> {
  if (request.method !== "POST") return null;

  let pathname: string;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return null;
  }

  const field = PASSWORD_FIELD_BY_PATH[pathname];
  if (!field) return null;

  let body: unknown;
  try {
    body = await readBody(request);
  } catch {
    return null;
  }

  const value = (body as Record<string, unknown> | null | undefined)?.[field];
  if (typeof value !== "string" || value.length === 0) return null;

  const parsed = passwordSchema.safeParse(value);
  if (parsed.success) return null;

  return Response.json(
    {
      message:
        parsed.error.issues[0]?.message ||
        "Password does not meet the requirements",
      code: "PASSWORD_TOO_WEAK",
      status: 400,
    },
    { status: 400 }
  );
}
