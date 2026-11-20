import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { isSafeCallbackPath } from "@/lib/edge-security";

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Login",
  description: "Login to your Rollnexa marketplace account",
  path: "/login",
  noIndex: true,
});

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = isSafeCallbackPath(params.callbackUrl)
    ? params.callbackUrl
    : undefined;
  const oauthError = params.error?.trim() || undefined;
  const initialEmail = params.email?.trim().slice(0, 254) || undefined;

  return (
    <AuthLayout
      badge="Welcome Back!"
      headline="Login to Your Rollnexa Account"
      description="Access your account to manage listings, messages and more."
    >
      <LoginForm
        callbackUrl={callbackUrl}
        oauthError={oauthError}
        initialEmail={initialEmail}
      />
    </AuthLayout>
  );
}
