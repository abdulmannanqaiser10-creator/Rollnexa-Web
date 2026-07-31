"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck } from "lucide-react";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(80),
  avatar: z.string().trim().url("Avatar must be a valid URL").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
});

type ProfileFormInput = z.infer<typeof profileSchema>;

type AccountProfileSettingsFormProps = {
  initial: ProfileFormInput & { email: string };
  roleLabel: "seller" | "buyer" | "admin";
  onSavedMessage?: string;
};

export function AccountProfileSettingsForm({
  initial,
  roleLabel,
  onSavedMessage = "Profile settings updated.",
}: AccountProfileSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initial.name || "",
      avatar: initial.avatar || "",
      phone: initial.phone || "",
      companyName: initial.companyName || "",
      bio: initial.bio || "",
      city: initial.city || "",
      country: initial.country || "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(values: ProfileFormInput) {
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Failed to save profile settings.");
        return;
      }
      setSuccess(onSavedMessage);
    } catch (e) {
      console.error(`[${roleLabel}/profile] save failed:`, e);
      setError("Failed to save profile settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rn-panel">
        <h2 className="font-display text-xl font-bold text-[#111827]">
          Profile Information
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Keep your {roleLabel} profile up to date for better marketplace trust.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              Full Name
            </span>
            <input
              {...register("name")}
              className="rn-input"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            ) : null}
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              Avatar URL
            </span>
            <input
              {...register("avatar")}
              className="rn-input"
              placeholder="https://..."
              aria-invalid={Boolean(errors.avatar)}
            />
            {errors.avatar ? (
              <p className="text-xs text-red-600">{errors.avatar.message}</p>
            ) : null}
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              Phone
            </span>
            <input {...register("phone")} className="rn-input" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              Company Name
            </span>
            <input {...register("companyName")} className="rn-input" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              City
            </span>
            <input {...register("city")} className="rn-input" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              Country
            </span>
            <input {...register("country")} className="rn-input" />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              Bio
            </span>
            <textarea
              {...register("bio")}
              rows={4}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#F5B800]"
            />
            {errors.bio ? (
              <p className="text-xs text-red-600">{errors.bio.message}</p>
            ) : null}
          </label>
        </div>
      </section>

      <section className="rn-panel">
        <h2 className="font-display text-xl font-bold text-[#111827]">
          Account Security
        </h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Email and authentication are managed by Better Auth.
        </p>
        <div className="mt-4 rounded-xl border border-black/5 bg-[#F6F7F9] p-4">
          <p className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
            Login Email
          </p>
          <p className="mt-1 text-sm font-semibold text-[#111827]">
            {initial.email}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Password and provider security are handled through Better Auth.
          </p>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rn-btn-primary disabled:opacity-60"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
