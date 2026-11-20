"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import {
  authClient,
  describeAuthError,
  isExpectedAuthError,
  mapAuthError,
} from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/validations/auth";
import type { z } from "zod";

type ResetValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetValues) {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        token,
        newPassword: data.password,
      });

      if (resetError) {
        const details = describeAuthError(resetError);
        if (isExpectedAuthError(resetError)) {
          console.warn("[reset] password reset rejected:", details);
        } else {
          console.error("[reset] password reset failed:", details);
        }
        setError(
          mapAuthError(
            resetError,
            "We couldn't reset your password. Please try again."
          )
        );
        return;
      }

      setDone(true);
    } catch (err) {
      console.error("[reset] unexpected error:", err);
      setError("A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      >
        Your password has been reset.
        <Link
          href="/login"
          className="mt-1 block font-semibold text-amber-600 hover:text-amber-700"
        >
          Log in with your new password
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <PasswordInput
            id="password"
            placeholder="Create a new password"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error password-hint" : "password-hint"
            }
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
          <p id="password-hint" className="text-xs text-gray-400">
            At least 8 characters with uppercase, lowercase, number, and symbol.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p
              id="confirm-password-error"
              role="alert"
              className="text-xs text-red-600"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Updating password...
            </>
          ) : (
            <>
              Reset password
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Link expired?{" "}
        <Link
          href="/forgot-password"
          className="font-semibold text-amber-600 hover:text-amber-700"
        >
          Request a new one
        </Link>
      </p>
    </>
  );
}

export { ResetPasswordForm };
