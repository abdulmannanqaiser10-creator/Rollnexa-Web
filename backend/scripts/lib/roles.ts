/** Role → dashboard path helper for backend scripts/tests (mirrors frontend/lib/auth/roles). */
export type AppRole = "BUYER" | "SELLER" | "ADMIN";

export function dashboardPathForRole(role?: string | null): string {
  switch (role) {
    case "SELLER":
      return "/seller/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "BUYER":
    default:
      return "/buyer/dashboard";
  }
}
