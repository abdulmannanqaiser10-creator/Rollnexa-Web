"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeViewedAt } from "@/lib/format";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function iconForType(type: string) {
  if (type === "NEW_MESSAGE") return "💬";
  if (type === "NEW_INQUIRY") return "📩";
  if (type === "MACHINE_APPROVED") return "✅";
  if (type === "MACHINE_REJECTED") return "⚠️";
  if (type === "NEW_REVIEW") return "⭐";
  if (type === "PAYMENT_SUCCESSFUL") return "💳";
  if (type === "PAYMENT_FAILED") return "❌";
  if (type === "SUBSCRIPTION_ACTIVATED" || type === "SUBSCRIPTION_RENEWED") return "✨";
  if (type === "SUBSCRIPTION_EXPIRED" || type === "SUBSCRIPTION_EXPIRING") return "⏳";
  if (type === "INVOICE_READY") return "🧾";
  return "🔔";
}

export function NotificationBell({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadRecent = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(
        "/api/notifications?page=1&pageSize=8&status=ALL&type=ALL",
        { signal, credentials: "same-origin", cache: "no-store" }
      );
      if (signal?.aborted) return;
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error || "Unable to load notifications.");
        return;
      }
      setItems(json.data?.items || []);
      setUnreadCount(json.data?.unreadCount || 0);
      setError(null);
    } catch (err) {
      // Abort / Fast Refresh / brief server restarts surface as TypeError: Failed to fetch.
      // Ignore those so the console stays clean; keep last good state.
      if (
        signal?.aborted ||
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(err.message))
      ) {
        return;
      }
      console.error("[notifications] load recent failed:", err);
      setError("Unable to load notifications.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;

    const run = async () => {
      if (document.hidden || inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        await loadRecent(controller.signal);
      } finally {
        inFlight = false;
      }
    };

    void run();
    const timer = window.setInterval(() => {
      void run();
    }, 15000);
    const onVisibility = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadRecent]);

  async function onMarkAllRead() {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", { method: "POST" });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error || "Unable to mark notifications as read.");
        return;
      }
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(json.data?.unreadCount || 0);
      router.refresh();
    } catch (err) {
      console.error("[notifications] mark all read failed:", err);
      setError("Unable to mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function onOpenNotification(id: string) {
    try {
      const response = await fetch(`/api/notifications/${id}/open`, {
        method: "POST",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error || "Unable to open notification.");
        return;
      }
      const href = json.data?.href || "/notifications";
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setOpen(false);
      router.push(href);
      router.refresh();
    } catch (err) {
      console.error("[notifications] open failed:", err);
      setError("Unable to open notification.");
    }
  }

  const hasUnread = unreadCount > 0;
  const unreadLabel = useMemo(
    () => (unreadCount > 99 ? "99+" : String(unreadCount)),
    [unreadCount]
  );

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative inline-flex size-10 items-center justify-center rounded-xl border border-black/10 bg-white text-rn-ink"
      >
        <Bell className="size-4" />
        {hasUnread ? (
          <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rn-gold px-1 text-[10px] font-bold text-rn-ink">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_18px_40px_rgba(8,13,18,0.12)]">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <p className="font-display text-base font-bold text-rn-ink">Notifications</p>
              {hasUnread ? (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rn-ink disabled:opacity-60"
                >
                  {markingAll ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-black/5" />
                  ))}
                </div>
              ) : error ? (
                <p className="p-4 text-sm text-red-600">{error}</p>
              ) : items.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-2xl">🔔</p>
                  <p className="mt-2 text-sm font-semibold text-rn-ink">No notifications yet.</p>
                  <p className="mt-1 text-xs text-rn-muted">
                    Important updates about listings, messages, and account activity will appear here.
                  </p>
                </div>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onOpenNotification(item.id)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-black/5 px-4 py-3 text-left hover:bg-rn-surface",
                          !item.isRead && "bg-rn-gold/10"
                        )}
                      >
                        <span className="mt-0.5 text-base">{iconForType(item.type)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-rn-ink">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-rn-muted">
                            {item.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-rn-muted">
                            {formatRelativeViewedAt(item.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-black/5 px-4 py-3">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="inline-flex text-sm font-semibold text-rn-ink hover:text-rn-gold"
              >
                View All Notifications
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
