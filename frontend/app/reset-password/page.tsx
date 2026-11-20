import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Reset Password",
  description: "Choose a new password for your Rollnexa account",
  path: "/reset-password",
  noIndex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const hasToken = typeof token === "string" && token.length > 0;

  return (
    <AuthLayout
      badge="Secure Reset"
      headline="Choose a New Password"
      description={
        hasToken
          ? "Set a new password for your account. You'll use it the next time you sign in."
          : "Open the link from your email to continue. If you are already on the reset page, use the secure form from your email provider to complete the change."
      }
    >
      {hasToken ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
            This page needs the reset link from your email, which carries the
            token that verifies the request.{" "}
            <Link href="/forgot-password" className="font-medium text-amber-600 hover:text-amber-700">
              Request a new reset link
            </Link>
          </div>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-gray-900 hover:bg-amber-400"
            >
              Back to login
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
