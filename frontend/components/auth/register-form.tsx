"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { PasswordInput } from "./password-input";
import {
  authClient,
  dashboardPathForRole,
  describeAuthError,
  isDuplicateEmailError,
  isExpectedAuthError,
  mapAuthError,
} from "@/lib/auth-client";
import {
  getPasswordStrength,
  registerSchema,
  type PasswordStrength,
} from "@/lib/validations/auth";
import { SocialButtons } from "./social-buttons";
import type { z } from "zod";

type RegisterValues = z.infer<typeof registerSchema>;

const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { label: string; barClass: string; textClass: string }
> = {
  weak: {
    label: "Weak",
    barClass: "bg-red-500 w-1/4",
    textClass: "text-red-600",
  },
  fair: {
    label: "Fair",
    barClass: "bg-orange-500 w-2/4",
    textClass: "text-orange-600",
  },
  good: {
    label: "Good",
    barClass: "bg-amber-500 w-3/4",
    textClass: "text-amber-600",
  },
  strong: {
    label: "Strong",
    barClass: "bg-emerald-500 w-full",
    textClass: "text-emerald-600",
  },
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-red-600">
      {message}
    </p>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "BUYER",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const passwordValue = useWatch({ control, name: "password" });
  const passwordStrength = passwordValue
    ? getPasswordStrength(passwordValue)
    : null;
  const strengthConfig = passwordStrength
    ? STRENGTH_CONFIG[passwordStrength]
    : null;

  async function onSubmit(data: RegisterValues) {
    if (loading) return;

    setError(null);
    setRegisteredEmail(null);
    setLoading(true);

    try {
      const { data: result, error: signUpError } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (signUpError) {
        const details = describeAuthError(signUpError);
        // A rejected sign-up the visitor can act on is a UI outcome, not a bug —
        // console.error would raise a dev overlay on top of the message we show.
        if (isExpectedAuthError(signUpError)) {
          console.warn("[register] sign-up rejected:", details);
        } else {
          console.error("[register] sign-up failed:", details);
        }
        setError(
          mapAuthError(signUpError, "Registration failed. Please try again.")
        );
        if (isDuplicateEmailError(signUpError)) {
          setRegisteredEmail(data.email);
        }
        return;
      }

      try {
        const profileRes = await fetch("/api/profile", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: data.phone }),
        });
        if (!profileRes.ok) {
          console.error(
            "[register] profile update failed:",
            profileRes.status,
            await profileRes.text()
          );
        }
      } catch (profileError) {
        console.error("[register] profile update error:", profileError);
      }

      const role = result?.user?.role ?? data.role;
      router.push(dashboardPathForRole(role));
      router.refresh();
    } catch (err) {
      console.error("[register] unexpected error:", err);
      setError("A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Fill in the details to get started
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
          {registeredEmail && (
            <Link
              href={`/login?email=${encodeURIComponent(registeredEmail)}`}
              className="mt-1 block font-semibold text-amber-600 hover:text-amber-700"
            >
              Log in with this email
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            autoComplete="name"
            disabled={loading}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          <FieldError id="name-error" message={errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            autoComplete="tel"
            disabled={loading}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
          <FieldError id="phone-error" message={errors.phone?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">I am a</Label>
          <Select id="role" disabled={loading} {...register("role")}>
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
          </Select>
          {errors.role && (
            <p className="text-xs text-red-600">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            placeholder="Create a password"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error password-hint" : "password-hint"
            }
            {...register("password")}
          />
          <FieldError id="password-error" message={errors.password?.message} />
          {passwordStrength && strengthConfig && (
            <div className="space-y-1.5" aria-live="polite">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthConfig.barClass}`}
                />
              </div>
              <p className={`text-xs font-medium ${strengthConfig.textClass}`}>
                Password strength: {strengthConfig.label}
              </p>
            </div>
          )}
          <p id="password-hint" className="text-xs text-gray-400">
            At least 8 characters with uppercase, lowercase, number, and symbol.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your password"
            autoComplete="new-password"
            disabled={loading}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            {...register("confirmPassword")}
          />
          <FieldError
            id="confirm-password-error"
            message={errors.confirmPassword?.message}
          />
        </div>

        <div className="space-y-1.5 pt-1">
          <Controller
            name="terms"
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-2.5">
                <Checkbox
                  className="mt-0.5"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  disabled={loading}
                  aria-invalid={Boolean(errors.terms)}
                  aria-describedby={errors.terms ? "terms-error" : undefined}
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-amber-600 hover:text-amber-700"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-amber-600 hover:text-amber-700"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            )}
          />
          <FieldError id="terms-error" message={errors.terms?.message} />
        </div>

        <SocialButtons
          disabled={loading}
          dividerText="Or sign up with"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Register
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-amber-600 hover:text-amber-700"
        >
          Login here
        </Link>
      </p>
    </>
  );
}

export { RegisterForm };
