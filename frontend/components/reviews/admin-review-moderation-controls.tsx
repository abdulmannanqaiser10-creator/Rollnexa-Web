"use client";

import { useState } from "react";

export function AdminReviewModerationControls({
  reviewId,
  currentStatus,
}: {
  reviewId: string;
  currentStatus: "PUBLISHED" | "HIDDEN" | "REMOVED";
}) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSave() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate",
          status,
          moderationNote: note || undefined,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Failed to update review.");
        return;
      }
      setMessage("Review status updated.");
    } catch (error) {
      console.error("[admin/reviews] moderation failed:", error);
      setMessage("Failed to update review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as typeof status)}
        className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs text-rn-ink"
      >
        <option value="PUBLISHED">Published</option>
        <option value="HIDDEN">Hidden</option>
        <option value="REMOVED">Removed</option>
      </select>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Moderation note (optional)"
        className="h-9 min-w-[220px] flex-1 rounded-lg border border-black/10 px-3 text-xs text-rn-ink"
      />
      <button onClick={onSave} disabled={loading} className="rn-btn-secondary text-xs disabled:opacity-60">
        {loading ? "Saving..." : "Save"}
      </button>
      {message ? <p className="basis-full text-xs text-rn-muted">{message}</p> : null}
    </div>
  );
}
