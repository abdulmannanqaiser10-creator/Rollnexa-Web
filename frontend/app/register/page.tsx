import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Register",
  description: "Create your Rollnexa marketplace account",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <AuthLayout
      badge="Create Account"
      headline="Join Rollnexa Today!"
      description="Create your account and start buying or selling heavy equipment easily."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
