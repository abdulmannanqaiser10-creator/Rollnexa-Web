import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { BuyerShell } from "@/components/buyer/BuyerShell";
import { countUnreadConversations } from "@/lib/messaging/query";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login");

  const profile = await prisma.profile
    .findUnique({
      where: { userId: session.user.id },
      select: { avatar: true },
    })
    .catch(() => null);

  const unreadMessages = await countUnreadConversations(session.user.id).catch(
    () => 0
  );

  return (
    <BuyerShell
      buyerName={session.user.name || "Buyer"}
      buyerEmail={session.user.email}
      buyerImage={profile?.avatar || session.user.image || null}
      unreadMessages={unreadMessages}
    >
      {children}
    </BuyerShell>
  );
}
