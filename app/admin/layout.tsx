import { redirect } from "next/navigation";
import { dashboardPathForRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") {
    redirect(dashboardPathForRole(session.user.role));
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { avatar: true },
  });

  return (
    <AdminShell
      adminName={session.user.name || "Admin"}
      adminEmail={session.user.email}
      adminImage={profile?.avatar || session.user.image || null}
    >
      {children}
    </AdminShell>
  );
}
