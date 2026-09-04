"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ClearRecentlyViewedButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function clearHistory() {
    if (pending) return;
    const confirmed = window.confirm(
      "Clear your entire recently viewed history?"
    );
    if (!confirmed) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/recently-viewed?all=1", {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Unable to clear history");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to clear history. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={clearHistory}
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-rn-ink hover:border-red-300 hover:text-red-700 disabled:opacity-60"
      >
        <Trash2 className="size-4" />
        {pending ? "Clearing..." : "Clear History"}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
