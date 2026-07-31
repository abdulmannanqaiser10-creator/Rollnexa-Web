export type AppRole = "BUYER" | "SELLER" | "ADMIN";

export function dashboardPathForRole(role?: string | null): string {
  switch (role) {
    case "SELLER":
      return "/seller/dashboard";
    case "ADMIN":
      return "/admin";
    case "BUYER":
    default:
      return "/buyer/dashboard";
  }
}
