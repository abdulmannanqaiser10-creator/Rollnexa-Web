"use client";

import { useState } from "react";

export function SellerReviewReplyForm({ reviewId }: { reviewId: string }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          sellerReply: value,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Could not submit reply.");
        return;
      }
      setMessage("Reply submitted.");
      setValue("");
    } catch (error) {
      console.error("[seller/review-reply] failed:", error);
      setMessage("Could not submit reply.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2 rounded-lg border border-black/5 p-3">
      <label className="block text-xs font-semibold tracking-wide text-rn-muted uppercase">
        Reply to buyer review
      </label>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={3}
        maxLength={800}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-rn-ink outline-none focus:border-rn-gold"
        placeholder="Thank the buyer and address feedback."
      />
      {message ? <p className="text-xs text-rn-muted">{message}</p> : null}
      <button type="submit" disabled={loading} className="rn-btn-secondary text-xs disabled:opacity-60">
        {loading ? "Submitting..." : "Post Reply"}
      </button>
    </form>
  );
}
