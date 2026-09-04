import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Forgot Password",
  description: "Reset your Rollnexa account password",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      badge="Account Recovery"
      headline="Reset Your Password"
      description="Password reset email delivery is being finalized. Contact support if you need access restored."
    >
      <div className="space-y-6">
        <ForgotPasswordForm />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-amber-500 text-sm font-semibold text-gray-900 hover:bg-amber-400"
          >
            Back to Login
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
