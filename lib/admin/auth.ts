import "server-only";

import { getSession } from "@/lib/session";

export async function requireAdminApi() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
