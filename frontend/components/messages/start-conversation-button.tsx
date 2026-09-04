"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

type StartConversationButtonProps = {
  machineId: string;
  isAuthenticated: boolean;
  className?: string;
  label?: string;
};

export function StartConversationButton({
  machineId,
  isAuthenticated,
  className,
  label = "Message Seller",
}: StartConversationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Unable to start conversation");
        return;
      }
      router.push(`/buyer/messages?c=${json.data.conversationId}`);
    } catch {
      setError("Unable to start conversation. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className={
          className ||
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-rn-gold px-4 text-sm font-bold text-rn-ink disabled:opacity-60"
        }
      >
        <MessageSquare className="size-4" />
        {pending ? "Opening..." : label}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
