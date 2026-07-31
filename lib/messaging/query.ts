import "server-only";

import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { createNotification } from "@/lib/notifications/service";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationListItem,
} from "@/lib/messaging/types";

export type {
  ChatMessage,
  ConversationDetail,
  ConversationListItem,
} from "@/lib/messaging/types";

export const MESSAGES_PAGE_SIZE = 50;

function displayName(
  name: string | null,
  companyName: string | null,
  fallback: string
) {
  return companyName || name || fallback;
}

function mapMachine(machine: {
  id: string;
  title: string;
  slug: string;
  price: number;
  location: string | null;
  status: string;
  brand: { name: string };
  category: { name: string };
  images: { url: string }[];
}): ConversationListItem["machine"] {
  return {
    id: machine.id,
    title: machine.title,
    slug: machine.slug,
    priceLabel: formatPrice(machine.price),
    location: machine.location,
    status: machine.status,
    available: machine.status === "PUBLISHED",
    imageUrl: machine.images[0]?.url ?? null,
    brandName: machine.brand.name,
    categoryName: machine.category.name,
  };
}

export async function openOrCreateConversation(params: {
  buyerId: string;
  machineId: string;
  initialMessage?: string;
}) {
  const machine = await prisma.machine.findFirst({
    where: { id: params.machineId, status: "PUBLISHED" },
    select: { id: true, sellerId: true, title: true },
  });

  if (!machine) {
    return { error: "Machine not found" as const, status: 404 as const };
  }

  if (machine.sellerId === params.buyerId) {
    return {
      error: "You cannot message yourself about your own listing" as const,
      status: 400 as const,
    };
  }

  let conversation = await prisma.conversation.findUnique({
    where: {
      buyerId_sellerId_machineId: {
        buyerId: params.buyerId,
        sellerId: machine.sellerId,
        machineId: machine.id,
      },
    },
    select: { id: true },
  });

  const created = !conversation;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        buyerId: params.buyerId,
        sellerId: machine.sellerId,
        machineId: machine.id,
      },
      select: { id: true },
    });
  }

  if (params.initialMessage?.trim()) {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: params.buyerId,
          content: params.initialMessage.trim(),
        },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    await createNotification({
      userId: machine.sellerId,
      type: "NEW_MESSAGE",
      title: "New message",
      message: "You have a new message in your conversation inbox.",
      relatedEntityId: conversation.id,
      relatedEntityType: "CONVERSATION",
    });
  }

  return {
    conversationId: conversation.id,
    created,
    machineTitle: machine.title,
  };
}

export async function listConversationsForUser(
  userId: string
): Promise<ConversationListItem[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      updatedAt: true,
      buyer: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { companyName: true, avatar: true } },
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { companyName: true, avatar: true } },
        },
      },
      machine: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          location: true,
          status: true,
          brand: { select: { name: true } },
          category: { select: { name: true } },
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              readAt: null,
            },
          },
        },
      },
    },
  });

  return conversations.map((c) => {
    const other = c.buyerId === userId ? c.seller : c.buyer;
    const last = c.messages[0] ?? null;

    return {
      id: c.id,
      updatedAt: c.updatedAt.toISOString(),
      unreadCount: c._count.messages,
      otherParticipant: {
        id: other.id,
        name: displayName(
          other.name,
          other.profile?.companyName ?? null,
          c.buyerId === userId ? "Seller" : "Buyer"
        ),
        image: other.profile?.avatar || other.image || null,
      },
      machine: mapMachine(c.machine),
      lastMessage: last
        ? {
            id: last.id,
            content: last.content,
            createdAt: last.createdAt.toISOString(),
            senderId: last.senderId,
          }
        : null,
    };
  });
}

export async function getConversationForUser(params: {
  conversationId: string;
  userId: string;
  before?: string | null;
  limit?: number;
}): Promise<ConversationDetail | null> {
  const limit = Math.min(params.limit ?? MESSAGES_PAGE_SIZE, 100);

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      OR: [{ buyerId: params.userId }, { sellerId: params.userId }],
    },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      updatedAt: true,
      buyer: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { companyName: true, avatar: true } },
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { companyName: true, avatar: true } },
        },
      },
      machine: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          location: true,
          status: true,
          brand: { select: { name: true } },
          category: { select: { name: true } },
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });

  if (!conversation) return null;

  const beforeDate = params.before ? new Date(params.before) : null;

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      ...(beforeDate && !Number.isNaN(beforeDate.getTime())
        ? { createdAt: { lt: beforeDate } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      content: true,
      senderId: true,
      attachmentUrl: true,
      attachmentType: true,
      readAt: true,
      createdAt: true,
    },
  });

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;
  page.reverse();

  const other =
    conversation.buyerId === params.userId
      ? conversation.seller
      : conversation.buyer;

  return {
    id: conversation.id,
    buyerId: conversation.buyerId,
    sellerId: conversation.sellerId,
    updatedAt: conversation.updatedAt.toISOString(),
    otherParticipant: {
      id: other.id,
      name: displayName(
        other.name,
        other.profile?.companyName ?? null,
        conversation.buyerId === params.userId ? "Seller" : "Buyer"
      ),
      image: other.profile?.avatar || other.image || null,
    },
    machine: mapMachine(conversation.machine),
    messages: page.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      attachmentUrl: m.attachmentUrl,
      attachmentType: m.attachmentType,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      isMine: m.senderId === params.userId,
    })),
    hasMore,
  };
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      OR: [{ buyerId: params.senderId }, { sellerId: params.senderId }],
    },
    select: { id: true, buyerId: true, sellerId: true },
  });

  if (!conversation) {
    return { error: "Conversation not found" as const, status: 404 as const };
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: params.senderId,
        content: params.content,
        attachmentUrl: params.attachmentUrl || null,
        attachmentType: params.attachmentType || null,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        attachmentUrl: true,
        attachmentType: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  const recipientId =
    conversation.buyerId === params.senderId
      ? conversation.sellerId
      : conversation.buyerId;

  await createNotification({
    userId: recipientId,
    type: "NEW_MESSAGE",
    title: "New message",
    message: "You have a new message in your conversation inbox.",
    relatedEntityId: conversation.id,
    relatedEntityType: "CONVERSATION",
  });

  return {
    message: {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      attachmentUrl: message.attachmentUrl,
      attachmentType: message.attachmentType,
      readAt: message.readAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
      isMine: true,
    } satisfies ChatMessage,
  };
}

export async function markConversationRead(params: {
  conversationId: string;
  userId: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      OR: [{ buyerId: params.userId }, { sellerId: params.userId }],
    },
    select: { id: true },
  });

  if (!conversation) {
    return { error: "Conversation not found" as const, status: 404 as const };
  }

  const result = await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: { not: params.userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { updated: result.count };
}

export async function countUnreadConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: {
      id: true,
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              readAt: null,
            },
          },
        },
      },
    },
  });

  return conversations.reduce(
    (sum, c) => sum + (c._count.messages > 0 ? 1 : 0),
    0
  );
}
