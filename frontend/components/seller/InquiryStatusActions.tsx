"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, MessageCircleReply, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "NEW" | "READ" | "REPLIED" | "CLOSED";

const STATUS_OPTIONS: {
  value: Status;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}[] = [
  {
    value: "READ",
    label: "Mark as Read",
    icon: Clock,
    className: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
  },
  {
    value: "REPLIED",
    label: "Mark as Replied",
    icon: MessageCircleReply,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
  {
    value: "CLOSED",
    label: "Close Inquiry",
    icon: XCircle,
    className: "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
  },
  {
    value: "NEW",
    label: "Reopen",
    icon: CheckCircle,
    className: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
];

type InquiryStatusActionsProps = {
  inquiryId: string;
  currentStatus: string;
};

export function InquiryStatusActions({
  inquiryId,
  currentStatus,
}: InquiryStatusActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: Status) {
    if (pending) return;
    setPending(status);
    setError(null);

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Unable to update status");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to update status. Please try again.");
    } finally {
      setPending(null);
    }
  }

  const available = STATUS_OPTIONS.filter((opt) => opt.value !== currentStatus);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-base font-bold text-[#111827]">
        Update Status
      </h2>
      <p className="mt-1 text-xs text-[#6B7280]">
        Current:{" "}
        <span className="font-semibold text-[#111827]">{currentStatus}</span>
      </p>
      {error ? (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {available.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={Boolean(pending)}
            onClick={() => updateStatus(opt.value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50",
              opt.className
            )}
          >
            <opt.icon className="size-3.5" />
            {pending === opt.value ? "Updating..." : opt.label}
          </button>
        ))}
      </div>
    </section>
  );
}
