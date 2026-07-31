/** Serializable messaging types — safe for Client Components. */

export type ConversationListItem = {
  id: string;
  updatedAt: string;
  unreadCount: number;
  otherParticipant: {
    id: string;
    name: string;
    image: string | null;
  };
  machine: {
    id: string;
    title: string;
    slug: string;
    priceLabel: string;
    location: string | null;
    status: string;
    available: boolean;
    imageUrl: string | null;
    brandName: string;
    categoryName: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
};

export type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  readAt: string | null;
  createdAt: string;
  isMine: boolean;
};

export type ConversationDetail = {
  id: string;
  buyerId: string;
  sellerId: string;
  updatedAt: string;
  otherParticipant: {
    id: string;
    name: string;
    image: string | null;
  };
  machine: ConversationListItem["machine"];
  messages: ChatMessage[];
  hasMore: boolean;
};
