import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Lock, Settings, UserRound } from "lucide-react";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Account Settings — Rollnexa Seller" };

export default async function SellerAccountSettingsPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#111827]">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Configure your seller account, notifications, and security preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/seller/profile" className="rn-card-hover p-5">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#080D12] text-[#F5B800]">
            <UserRound className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-[#111827]">Profile</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Update name, company info, avatar, and contact details.
          </p>
        </Link>

        <div className="rn-card p-5">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#080D12] text-[#F5B800]">
            <Bell className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-[#111827]">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Email/push notification controls will be added in the next phase.
          </p>
        </div>

        <div className="rn-card p-5">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#080D12] text-[#F5B800]">
            <Lock className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-[#111827]">
            Security
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Authentication is managed via Better Auth and your login provider.
          </p>
        </div>
      </div>

      <div className="rn-panel">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#080D12] text-[#F5B800]">
            <Settings className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-[#111827]">
              Account Snapshot
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Signed in as <span className="font-semibold text-[#111827]">{session.user.email}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
