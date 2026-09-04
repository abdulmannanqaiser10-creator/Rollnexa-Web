import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getUnreadNotificationCount,
  markNotificationRead,
} from "@/lib/notifications/query";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await markNotificationRead(session.user.id, id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const unread = await getUnreadNotificationCount(session.user.id);

    return NextResponse.json({
      success: true,
      data: { unreadCount: unread, alreadyRead: result.alreadyRead || false },
    });
  } catch (error) {
    console.error("[api/notifications/[id]/read] PATCH failed:", error);
    return NextResponse.json(
      { error: "Unable to mark notification as read" },
      { status: 500 }
    );
  }
}
