import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { notificationListQuerySchema } from "@/lib/validations/notifications";
import {
  getUnreadNotificationCount,
  listUserNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications/query";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = notificationListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      status: searchParams.get("status")?.toUpperCase() || undefined,
      type: searchParams.get("type")?.toUpperCase() || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query" },
        { status: 400 }
      );
    }

    const data = await listUserNotifications(session.user.id, parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[api/notifications] GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load notifications" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const updated = await markAllNotificationsRead(session.user.id);
    const unread = await getUnreadNotificationCount(session.user.id);

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read.",
      data: { updated, unreadCount: unread },
    });
  } catch (error) {
    console.error("[api/notifications] POST failed:", error);
    return NextResponse.json(
      { error: "Unable to update notifications" },
      { status: 500 }
    );
  }
}
