import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { MessagesInbox } from "@/components/messages/messages-inbox";

export const metadata = {
  title: "Messages — Rollnexa",
  description: "Chat with sellers about machines on Rollnexa.",
};

export default async function BuyerMessagesPage() {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login?callbackUrl=/buyer/messages");

  return (
    <div className="space-y-4">
      <div>
        <p className="rn-eyebrow">Inbox</p>
        <h2 className="rn-page-title text-2xl sm:text-3xl">Messages</h2>
        <p className="mt-1 text-sm text-rn-muted">
          Conversations with sellers about machines you are interested in.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-[min(720px,calc(100dvh-10rem))] animate-pulse rounded-2xl bg-black/5" />
        }
      >
        <MessagesInbox basePath="/buyer/messages" />
      </Suspense>
    </div>
  );
}
