"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { PasswordInput } from "./password-input";
import { SocialButtons } from "./social-buttons";
import {
  authClient,
  dashboardPathForRole,
  mapAuthError,
} from "@/lib/auth-client";

const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email"),
    phone: z.string().min(1, "Phone number is required"),
    role: z.enum(["BUYER", "SELLER"], { error: "Please select a role" }),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((v) => v === true, {
      message: "You must agree to the Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
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

  async function onSubmit(data: RegisterValues) {
    setError(null);
    setLoading(true);

    try {
      const { data: result, error: signUpError } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (signUpError) {
        console.error("[register] sign-up failed:", signUpError);
        setError(
          mapAuthError(signUpError, "Registration failed. Please try again.")
        );
        return;
      }

      try {
        const profileRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: data.phone }),
        });
        if (!profileRes.ok) {
          console.error(
            "[register] profile update failed:",
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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

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
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            autoComplete="tel"
            disabled={loading}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-red-600">{errors.phone.message}</p>
          )}
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
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
          <p className="text-xs text-gray-400">
            At least 8 characters. Include number &amp; symbol.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your password"
            autoComplete="new-password"
            disabled={loading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <label className="flex items-start gap-2.5 pt-1">
          <Checkbox className="mt-0.5" {...register("terms")} disabled={loading} />
          <span className="text-sm text-gray-600">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-amber-600 hover:text-amber-700">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-amber-600 hover:text-amber-700">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.terms && (
          <p className="text-xs text-red-600">{errors.terms.message}</p>
        )}

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

      <div className="mt-6">
        <SocialButtons />
      </div>

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
