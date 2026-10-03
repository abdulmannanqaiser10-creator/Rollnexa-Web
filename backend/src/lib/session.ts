import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAuthorizedAdmin } from "@/lib/admin/designated-admin";
import { getRequestHeaders } from "@/lib/request-context";
import { prisma } from "@/lib/db";

export async function getSession() {
  try {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    return await activeAccountSession(session);
  } catch {
    return activeAccountSession(await auth.api.getSession({ headers: await headers() }));
  }
}

async function activeAccountSession<T extends { user: { id: string } } | null>(session: T): Promise<T | null> {
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accountStatus: true } });
  return user?.accountStatus === "ACTIVE" ? session : null;
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
