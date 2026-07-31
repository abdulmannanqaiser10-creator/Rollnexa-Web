"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESETS = [
  { id: "MISSING_INFORMATION", label: "Missing information" },
  { id: "POOR_IMAGE_QUALITY", label: "Poor image quality" },
  { id: "INCORRECT_CATEGORY", label: "Incorrect category" },
  { id: "INCORRECT_BRAND", label: "Incorrect brand" },
  { id: "SUSPICIOUS_LISTING", label: "Suspicious listing" },
  { id: "DUPLICATE_LISTING", label: "Duplicate listing" },
  { id: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { id: "OTHER", label: "Other" },
] as const;

type AdminRejectListingDialogProps = {
  machineId: string;
  machineTitle: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function AdminRejectListingDialog({
  machineId,
  machineTitle,
  open,
  onClose,
  onSuccess,
}: AdminRejectListingDialogProps) {
  const router = useRouter();
  const [preset, setPreset] = useState<string>("MISSING_INFORMATION");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/machines/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionPreset: preset,
          rejectionReason: preset === "OTHER" ? reason : undefined,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Unable to reject listing.");
        return;
      }
      onSuccess(data?.message || "Listing rejected.");
      onClose();
      router.refresh();
    } catch (e) {
      console.error("[admin/reject-listing] failed:", e);
      setError("Unable to reject listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close rejection dialog"
        onClick={onClose}
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-lg rounded-2xl border border-black/5 bg-white p-5 shadow-2xl"
      >
        <h3 className="font-display text-lg font-bold text-rn-ink">Reject Listing</h3>
        <p className="mt-1 text-sm text-rn-muted">{machineTitle}</p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-rn-muted">
          Rejection Reason
        </label>
        <select
          value={preset}
          onChange={(event) => setPreset(event.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-black/10 px-3 text-sm"
        >
          {PRESETS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        {preset === "OTHER" ? (
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            required
            minLength={10}
            placeholder="Explain what the seller should fix."
            className="mt-3 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
        ) : null}

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rn-btn-secondary h-10 px-4 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="rn-btn-primary h-10 px-4 text-sm disabled:opacity-60">
            {loading ? "Rejecting..." : "Reject Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
