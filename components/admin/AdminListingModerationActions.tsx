"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRejectListingDialog } from "@/components/admin/AdminRejectListingDialog";

type AdminListingModerationActionsProps = {
  machineId: string;
  machineTitle: string;
  status:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "REJECTED"
    | "PUBLISHED"
    | "SOLD"
    | "ARCHIVED";
  isFeatured: boolean;
};

export function AdminListingModerationActions({
  machineId,
  machineTitle,
  status,
  isFeatured,
}: AdminListingModerationActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  async function runAction(
    action: "approve" | "archive" | "mark_sold" | "feature" | "unfeature",
    successMessage: string
  ) {
    setLoading(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/machines/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Action failed.");
        return;
      }
      setMessage(data?.message || successMessage);
      if (action === "archive") setConfirmArchive(false);
      router.refresh();
    } catch (error) {
      console.error("[admin/listing-moderation] failed:", error);
      setMessage("Action failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status === "PENDING_REVIEW" ? (
          <>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => runAction("approve", "Listing approved successfully.")}
              className="rn-btn-primary h-9 px-3 text-xs disabled:opacity-60"
            >
              {loading === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => setRejectOpen(true)}
              className="rn-btn-secondary h-9 px-3 text-xs disabled:opacity-60"
            >
              Reject
            </button>
          </>
        ) : null}

        {status === "PUBLISHED" ? (
          <>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() =>
                runAction(
                  isFeatured ? "unfeature" : "feature",
                  isFeatured ? "Featured status removed." : "Listing marked as featured."
                )
              }
              className="rn-btn-secondary h-9 px-3 text-xs disabled:opacity-60"
            >
              {loading === "feature" || loading === "unfeature"
                ? "Saving..."
                : isFeatured
                  ? "Unfeature"
                  : "Feature"}
            </button>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => runAction("mark_sold", "Listing marked as sold.")}
              className="rn-btn-secondary h-9 px-3 text-xs disabled:opacity-60"
            >
              Mark Sold
            </button>
          </>
        ) : null}

        {status !== "ARCHIVED" ? (
          <button
            type="button"
            disabled={Boolean(loading)}
            onClick={() => setConfirmArchive(true)}
            className="rn-btn-secondary h-9 px-3 text-xs text-red-700 disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}

        {message ? <span className="text-xs text-rn-muted">{message}</span> : null}
      </div>

      <AdminRejectListingDialog
        machineId={machineId}
        machineTitle={machineTitle}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSuccess={setMessage}
      />

      {confirmArchive ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close archive dialog"
            onClick={() => setConfirmArchive(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-black/5 bg-white p-5 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-rn-ink">Remove this listing?</h3>
            <p className="mt-2 text-sm text-rn-muted">
              This archives &quot;{machineTitle}&quot; and removes it from public marketplace views.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                className="rn-btn-secondary h-10 px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading === "archive"}
                onClick={() => runAction("archive", "Listing archived.")}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading === "archive" ? "Removing..." : "Remove Listing"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
