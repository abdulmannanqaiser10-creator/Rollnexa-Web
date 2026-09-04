import "server-only";

import { getSession } from "@/lib/session";
import { isAuthorizedAdmin } from "@/lib/admin/designated-admin";
import { NextResponse } from "next/server";

export async function requireAdminApi() {
  const session = await getSession();
  if (!session?.user?.id || !isAuthorizedAdmin(session.user)) {
    return null;
  }
  return session;
}

export async function requireAdminApiResponse() {
  const session = await requireAdminApi();
  if (!session) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { response: null, session };
}
