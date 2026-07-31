import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Register — Rollnexa",
  description: "Create your Rollnexa marketplace account",
};

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
