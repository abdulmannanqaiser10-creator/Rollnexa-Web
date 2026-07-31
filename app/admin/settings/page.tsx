import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AccountProfileSettingsForm } from "@/components/seller/seller-profile-settings-form";

export const metadata = { title: "Settings — Rollnexa Admin" };

export default async function AdminSettingsPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login?callbackUrl=/admin/settings");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      avatar: true,
      phone: true,
      companyName: true,
      bio: true,
      city: true,
      country: true,
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Account</p>
        <h1 className="rn-page-title">Admin Settings</h1>
        <p className="mt-2 text-sm text-rn-muted">
          Update your admin profile. Password changes use the existing Better Auth security flow.
        </p>
      </header>

      <AccountProfileSettingsForm
        roleLabel="admin"
        onSavedMessage="Admin profile updated."
        initial={{
          name: session.user.name || "",
          email: session.user.email,
          avatar: profile?.avatar || session.user.image || "",
          phone: profile?.phone || "",
          companyName: profile?.companyName || "",
          bio: profile?.bio || "",
          city: profile?.city || "",
          country: profile?.country || "",
        }}
      />
    </div>
  );
}
