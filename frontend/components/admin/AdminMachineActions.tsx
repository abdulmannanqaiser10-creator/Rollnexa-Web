"use client";

import { useState } from "react";
import type { ListingStatusValue } from "@/lib/machines/listing-status";

type AdminMachineActionsProps = {
  machineId: string;
  status: ListingStatusValue;
  isFeatured: boolean;
};

export function AdminMachineActions({
  machineId,
  status,
  isFeatured,
}: AdminMachineActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [featured, setFeatured] = useState(isFeatured);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(updates: {
    status?: typeof currentStatus;
    isFeatured?: boolean;
  }) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/machines/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Update failed.");
        return;
      }
      if (updates.status) setCurrentStatus(updates.status);
      if (typeof updates.isFeatured === "boolean") setFeatured(updates.isFeatured);
      setMessage("Updated.");
    } catch (error) {
      console.error("[admin/machine-actions] failed:", error);
      setMessage("Update failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentStatus}
        disabled={loading}
        onChange={(event) =>
          save({ status: event.target.value as typeof currentStatus })
        }
        className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs"
      >
        <option value="DRAFT">Draft</option>
        <option value="PENDING_REVIEW">Pending Review</option>
        <option value="REJECTED">Rejected</option>
        <option value="PUBLISHED">Published</option>
        <option value="SOLD">Sold</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <button
        type="button"
        disabled={loading}
        onClick={() => save({ isFeatured: !featured })}
        className="rn-btn-secondary h-9 px-3 text-xs disabled:opacity-60"
      >
        {featured ? "Unfeature" : "Feature"}
      </button>
      {message ? <span className="text-xs text-rn-muted">{message}</span> : null}
    </div>
  );
}
