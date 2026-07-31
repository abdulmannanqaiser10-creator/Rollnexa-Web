"use client";

import Link from "next/link";

type SellerListingFeedbackProps = {
  status: string;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  machineId: string;
};

export function SellerListingFeedback({
  status,
  rejectionReason,
  rejectedAt,
  machineId,
}: SellerListingFeedbackProps) {
  if (status === "PENDING_REVIEW") {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        <p className="font-semibold">Awaiting admin approval</p>
        <p className="mt-1 text-violet-800/90">
          Your listing is in the review queue. You will be notified once an admin approves or rejects it.
        </p>
      </div>
    );
  }

  if (status !== "REJECTED" || !rejectionReason) {
    return null;
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
      <p className="font-semibold">Listing Status: Rejected</p>
      <p className="mt-2">
        <span className="font-medium">Reason:</span> {rejectionReason}
      </p>
      {rejectedAt ? (
        <p className="mt-1 text-xs text-rose-800/80">
          Rejected on {new Date(rejectedAt).toLocaleString()}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/seller/machines/${machineId}/edit`} className="rn-btn-secondary h-9 px-3 text-xs">
          Edit Listing
        </Link>
        <SubmitForApprovalButton machineId={machineId} />
      </div>
    </div>
  );
}

function SubmitForApprovalButton({ machineId }: { machineId: string }) {
  async function onSubmit() {
    const response = await fetch(`/api/seller/machines/${machineId}/submit`, {
      method: "POST",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      alert(data?.error || "Unable to resubmit listing.");
      return;
    }
    window.location.reload();
  }

  return (
    <button type="button" onClick={onSubmit} className="rn-btn-primary h-9 px-3 text-xs">
      Resubmit for Approval
    </button>
  );
}
