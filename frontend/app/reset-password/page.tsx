import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Reset Password",
  description: "Choose a new password for your Rollnexa account",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      badge="Secure Reset"
      headline="Choose a New Password"
      description="Open the link from your email to continue. If you are already on the reset page, use the secure form from your email provider to complete the change."
    >
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
        Password reset links are handled by the Better Auth flow. If you reached this page from a reset email, complete the reset using the secure link provided in the email.
      </div>
      <div className="mt-4">
        <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-gray-900 hover:bg-amber-400">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
