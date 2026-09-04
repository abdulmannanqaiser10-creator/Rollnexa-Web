import "server-only";

import { prisma } from "@/lib/db";
import type {
  NotificationType,
  RelatedEntityType,
} from "@prisma/generated";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string | null;
  relatedEntityType?: RelatedEntityType | null;
};

export async function createNotification(input: CreateNotificationInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.trim(),
      message: input.message.trim(),
      relatedEntityId: input.relatedEntityId || null,
      relatedEntityType: input.relatedEntityType || null,
    },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  });
}

export async function notifyActiveAdmins(
  input: Omit<CreateNotificationInput, "userId">
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", accountStatus: "ACTIVE" },
    select: { id: true },
    take: 50,
  });

  return Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        ...input,
      })
    )
  );
}
