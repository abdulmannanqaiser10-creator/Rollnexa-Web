import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login — Rollnexa",
  description: "Login to your Rollnexa marketplace account",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl &&
    params.callbackUrl.startsWith("/") &&
    !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : undefined;

  return (
    <AuthLayout
      badge="Welcome Back!"
      headline="Login to Your Rollnexa Account"
      description="Access your account to manage listings, messages and more."
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}
