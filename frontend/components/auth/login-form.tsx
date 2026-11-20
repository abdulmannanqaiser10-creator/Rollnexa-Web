"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "./password-input";
import {
  authClient,
  dashboardPathForRole,
  describeAuthError,
  isExpectedAuthError,
  mapAuthError,
} from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations/auth";
import { isSafeCallbackPath } from "@/lib/edge-security";
import { SocialButtons } from "./social-buttons";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm({
  callbackUrl,
  oauthError,
  initialEmail,
}: {
  callbackUrl?: string;
  oauthError?: string;
  initialEmail?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(oauthError ?? null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail ?? "", password: "", remember: false },
  });

  async function onSubmit(data: LoginValues) {
    setError(null);
    setLoading(true);

    try {
      const { data: result, error: signInError } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.remember ?? true,
      });

      if (signInError) {
        const details = describeAuthError(signInError);
        if (isExpectedAuthError(signInError)) {
          console.warn("[login] sign-in rejected:", details);
        } else {
          console.error("[login] sign-in failed:", details);
        }
        setError(
          mapAuthError(signInError, "Invalid email or password")
        );
        return;
      }

      const safeCallback = isSafeCallbackPath(callbackUrl) ? callbackUrl : null;

      router.push(safeCallback || dashboardPathForRole(result?.user?.role));
      router.refresh();
    } catch (err) {
      console.error("[login] unexpected error:", err);
      setError("A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Login</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Checkbox {...register("remember")} disabled={loading} />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            Forgot Password?
          </Link>
        </div>

        <SocialButtons
          disabled={loading}
          dividerText="Or continue with"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Login
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-amber-600 hover:text-amber-700"
        >
          Register here
        </Link>
      </p>
    </>
  );
}

export { LoginForm };
