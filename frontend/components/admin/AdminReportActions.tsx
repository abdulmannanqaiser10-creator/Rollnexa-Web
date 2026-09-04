"use client";

import { useState } from "react";

type AdminReportActionsProps = {
  reportId: string;
  currentStatus: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
};

export function AdminReportActions({
  reportId,
  currentStatus,
}: AdminReportActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes || undefined }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Update failed.");
        return;
      }
      setMessage("Report updated.");
    } catch (error) {
      console.error("[admin/report-actions] failed:", error);
      setMessage("Update failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs"
        >
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="rn-btn-secondary h-9 px-3 text-xs disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
      <input
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Admin notes (optional)"
        className="h-9 w-full rounded-lg border border-black/10 px-3 text-xs"
      />
      {message ? <p className="text-xs text-rn-muted">{message}</p> : null}
    </div>
  );
}
