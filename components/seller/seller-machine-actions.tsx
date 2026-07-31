"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";

type SellerMachineActionsProps = {
  machineId: string;
  machineTitle: string;
};

/** @deprecated Prefer MachineActionMenu for the redesigned actions dropdown. */
export function SellerMachineActions({
  machineId,
}: SellerMachineActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (deleting) return;

    setError(null);
    setDeleting(true);

    try {
      const response = await fetch(`/api/seller/machines/${machineId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "Failed to delete machine. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Failed to delete machine. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/seller/machines/${machineId}/edit`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-gray-900 transition hover:bg-amber-400"
        >
          <Pencil className="size-3.5" />
          Edit
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
