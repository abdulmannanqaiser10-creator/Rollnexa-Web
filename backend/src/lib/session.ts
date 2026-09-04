import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAuthorizedAdmin } from "@/lib/admin/designated-admin";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return session;
}

export async function requireRole(role: "BUYER" | "SELLER" | "ADMIN") {
  const session = await getSession();
  if (!session) {
    return null;
  }
  if (session.user.role !== role) {
    return null;
  }
  if (role === "ADMIN" && !isAuthorizedAdmin(session.user)) {
    return null;
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}
