"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { describeAuthError } from "@/lib/auth-client";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const details = `${response.status} ${JSON.stringify(result ?? null)}`;
        if (response.status >= 500) {
          console.error("[forgot-password] request failed:", details);
        } else {
          console.warn("[forgot-password] request rejected:", details);
        }
        setStatus(
          response.status === 429
            ? "Too many requests. Please try again in a minute."
            : "Unable to process password reset request"
        );
        return;
      }

      setStatus(result?.message || "If this email exists, a reset link has been sent.");
      reset();
    } catch (error) {
      console.error("[forgot-password] request failed:", describeAuthError(error));
      setStatus("Unable to process password reset request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email address</Label>
        <Input id="forgot-email" type="email" placeholder="Enter your email" {...register("email")} />
        {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending..." : "Send reset link"}
      </Button>

      {status ? <p className="text-sm text-stone-600">{status}</p> : null}
    </form>
  );
}
