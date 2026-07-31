import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AccountProfileSettingsForm } from "@/components/seller/seller-profile-settings-form";

export const metadata = { title: "Profile Settings — Rollnexa Seller" };

export default async function SellerProfileSettingsPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

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
          Manage your seller identity and company profile.
        </p>
      </div>
      <AccountProfileSettingsForm
        roleLabel="seller"
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
