import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Login",
  description: "Login to your Rollnexa marketplace account",
  path: "/login",
  noIndex: true,
});

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl &&
    params.callbackUrl.startsWith("/") &&
    !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : undefined;
  const oauthError = params.error?.trim() || undefined;

  return (
    <AuthLayout
      badge="Welcome Back!"
      headline="Login to Your Rollnexa Account"
      description="Access your account to manage listings, messages and more."
    >
      <LoginForm callbackUrl={callbackUrl} oauthError={oauthError} />
    </AuthLayout>
  );
}
