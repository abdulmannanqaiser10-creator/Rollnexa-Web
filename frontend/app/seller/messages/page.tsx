import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { MessagesInbox } from "@/components/messages/messages-inbox";

export const metadata = { title: "Messages — Rollnexa Seller" };

export default async function SellerMessagesPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#111827]">
          Messages
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Chat with buyers about your machine listings.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-[min(720px,calc(100dvh-10rem))] animate-pulse rounded-2xl bg-black/5" />
        }
      >
        <MessagesInbox basePath="/seller/messages" browseHref="/seller/machines" />
      </Suspense>
    </div>
  );
}
