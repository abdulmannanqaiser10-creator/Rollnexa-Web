import "server-only";

import { prisma } from "@/lib/db";
import type {
  NotificationType,
  RelatedEntityType,
  Role,
} from "@prisma/generated";
import type { z } from "zod";
import type { notificationListQuerySchema } from "@/lib/validations/notifications";

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export async function listUserNotifications(
  userId: string,
  query: NotificationListQuery
) {
  const where = {
    userId,
    ...(query.status === "UNREAD"
      ? { isRead: false }
      : query.status === "READ"
        ? { isRead: true }
        : {}),
    ...(query.type !== "ALL" ? { type: query.type } : {}),
  };

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        readAt: true,
        relatedEntityId: true,
        relatedEntityType: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      readAt: item.readAt?.toISOString() || null,
    })),
    total,
    unreadCount,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, isRead: true },
  });
  if (!existing) return { error: "Notification not found" as const, status: 404 as const };
  if (existing.isRead) return { ok: true, alreadyRead: true as const };

  await prisma.notification.update({
    where: { id: existing.id },
    data: { isRead: true, readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
}

type NotificationTargetInput = {
  userId: string;
  role: Role;
  type: NotificationType;
  relatedEntityId: string | null;
  relatedEntityType: RelatedEntityType | null;
};

export async function resolveNotificationTarget(input: NotificationTargetInput) {
  const id = input.relatedEntityId;
  if (!id) return fallbackNotificationsHome(input.role);

  if (
    input.relatedEntityType === "MACHINE" &&
    (input.type === "MACHINE_APPROVED" ||
      input.type === "MACHINE_REJECTED" ||
      input.type === "NEW_REVIEW")
  ) {
    const machine = await prisma.machine.findFirst({
      where: { id, sellerId: input.userId },
      select: { id: true, slug: true },
    });
    if (!machine) return fallbackNotificationsHome(input.role);
    if (input.type === "MACHINE_REJECTED") return `/seller/machines/${machine.id}/edit`;
    if (input.type === "NEW_REVIEW") return "/seller/reviews";
    return `/machines/${machine.slug}`;
  }

  if (input.relatedEntityType === "INQUIRY" && input.type === "NEW_INQUIRY") {
    const inquiry = await prisma.inquiry.findFirst({
      where: { id, sellerId: input.userId },
      select: { id: true },
    });
    if (!inquiry) {
      const buyerInquiry = await prisma.inquiry.findFirst({
        where: { id, buyerId: input.userId },
        select: { id: true },
      });
      if (!buyerInquiry) return fallbackNotificationsHome(input.role);
      return "/buyer/inquiries";
    }
    return "/seller/inquiries";
  }

  if (input.role === "ADMIN") {
    if (input.relatedEntityType === "REPORT") {
      return "/admin/reports";
    }
    if (input.relatedEntityType === "MACHINE") {
      return `/admin/machines/${id}`;
    }
  }

  if (input.relatedEntityType === "CONVERSATION" && input.type === "NEW_MESSAGE") {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [{ buyerId: input.userId }, { sellerId: input.userId }],
      },
      select: { id: true, buyerId: true },
    });
    if (!conversation) return fallbackNotificationsHome(input.role);
    const base =
      input.role === "SELLER"
        ? "/seller/messages"
        : input.role === "BUYER"
          ? "/buyer/messages"
          : "/admin/dashboard";
    return `${base}?c=${conversation.id}`;
  }

  if (input.relatedEntityType === "PAYMENT") {
    return "/seller/payments";
  }

  if (input.relatedEntityType === "SUBSCRIPTION") {
    return "/seller/subscription";
  }

  return fallbackNotificationsHome(input.role);
}

function fallbackNotificationsHome(role: Role) {
  if (role === "SELLER") return "/seller/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  return "/buyer/dashboard";
}
