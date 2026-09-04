import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AccountProfileSettingsForm } from "@/components/seller/seller-profile-settings-form";

export const metadata = {
  title: "Profile Settings — Rollnexa Buyer",
};

export default async function BuyerProfilePage() {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login?callbackUrl=/buyer/profile");

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
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#111827]">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Update your buyer profile, contact details, and location.
        </p>
      </div>
      <AccountProfileSettingsForm
        roleLabel="buyer"
        onSavedMessage="Buyer profile updated."
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
