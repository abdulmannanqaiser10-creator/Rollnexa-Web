import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SellerShell } from "@/components/seller/SellerShell";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { avatar: true, companyName: true },
  });

  const sellerName =
    session.user.name || profile?.companyName || session.user.email;

  return (
    <SellerShell
      sellerName={sellerName}
      sellerEmail={session.user.email}
      sellerImage={profile?.avatar || session.user.image || null}
    >
      {children}
    </SellerShell>
  );
}
