import "server-only";

/**
 * Designated admin identity comes from env only (never hardcode passwords).
 * Prefer ADMIN_* ; fall back to DEV_ADMIN_* for existing local setups.
 */
export function getDesignatedAdminEmail(): string {
  const email =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.DEV_ADMIN_EMAIL?.trim() ||
    "";
  return email.toLowerCase();
}

export function getDesignatedAdminName(): string {
  return (
    process.env.ADMIN_NAME?.trim() ||
    process.env.DEV_ADMIN_NAME?.trim() ||
    "Rollnexa Admin"
  );
}

/** True when the given email is the env-configured admin account. */
export function isDesignatedAdminEmail(email?: string | null): boolean {
  const designated = getDesignatedAdminEmail();
  if (!designated || !email) return false;
  return email.trim().toLowerCase() === designated;
}

/**
 * Server gate: must be ADMIN role AND match designated admin email when configured.
 * If ADMIN_EMAIL / DEV_ADMIN_EMAIL is unset, role-only ADMIN is allowed (legacy).
 */
export function isAuthorizedAdmin(user?: {
  role?: string | null;
  email?: string | null;
} | null): boolean {
  if (!user || user.role !== "ADMIN") return false;
  const designated = getDesignatedAdminEmail();
  if (!designated) return true;
  return isDesignatedAdminEmail(user.email);
}
