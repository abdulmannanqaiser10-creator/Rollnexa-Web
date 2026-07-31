import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { Role } from "@/app/generated/prisma/client";
import {
  markNotificationRead,
  resolveNotificationTarget,
} from "@/lib/notifications/query";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const role = session.user.role as Role | undefined;
    if (!role) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        type: true,
        relatedEntityId: true,
        relatedEntityType: true,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await markNotificationRead(session.user.id, id);

    const href = await resolveNotificationTarget({
      userId: session.user.id,
      role,
      type: notification.type,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
    });

    return NextResponse.json({ success: true, data: { href } });
  } catch (error) {
    console.error("[api/notifications/[id]/open] POST failed:", error);
    return NextResponse.json(
      { error: "Unable to open notification" },
      { status: 500 }
    );
  }
}
