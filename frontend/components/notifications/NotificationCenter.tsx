"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeViewedAt } from "@/lib/format";

type Item = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationResponse = {
  items: Item[];
  total: number;
  totalPages: number;
  unreadCount: number;
};

const TYPE_OPTIONS = [
  "ALL",
  "NEW_INQUIRY",
  "NEW_MESSAGE",
  "MACHINE_APPROVED",
  "MACHINE_REJECTED",
  "NEW_REVIEW",
  "ACCOUNT_UPDATE",
] as const;

const STATUS_OPTIONS = ["ALL", "UNREAD", "READ"] as const;

export function NotificationCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotificationResponse>({
    items: [],
    total: 0,
    totalPages: 1,
    unreadCount: 0,
  });

  const page = Number(searchParams.get("page") || "1");
  const status = (searchParams.get("status") || "ALL").toUpperCase();
  const type = (searchParams.get("type") || "ALL").toUpperCase();

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(Math.max(1, page)));
    p.set("pageSize", "20");
    p.set("status", status);
    p.set("type", type);
    return p.toString();
  }, [page, status, type]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?${qs}`);
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error || "Unable to load notifications.");
        return;
      }
      setData(json.data);
      setError(null);
    } catch (err) {
      console.error("[notifications-center] load failed:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  function setFilter(next: { status?: string; type?: string; page?: number }) {
    const p = new URLSearchParams(searchParams.toString());
    if (next.status) p.set("status", next.status);
    if (next.type) p.set("type", next.type);
    if (typeof next.page === "number") p.set("page", String(next.page));
    else p.delete("page");
    router.push(`/notifications?${p.toString()}`);
  }

  async function onMarkAllRead() {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", { method: "POST" });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error || "Unable to update notifications.");
        return;
      }
      await load();
    } finally {
      setMarkingAll(false);
    }
  }

  async function onOpen(itemId: string) {
    if (openingId) return;
    setOpeningId(itemId);
    try {
      const response = await fetch(`/api/notifications/${itemId}/open`, {
        method: "POST",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error || "Unable to open notification.");
        return;
      }
      router.push(json.data?.href || "/notifications");
      router.refresh();
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rn-eyebrow">Updates</p>
          <h1 className="rn-page-title">Notification Center</h1>
          <p className="mt-1 text-sm text-rn-muted">
            {data.unreadCount} unread · {data.total} total
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={markingAll || data.unreadCount === 0}
          className="rn-btn-secondary h-10 px-4 text-sm disabled:opacity-60"
        >
          {markingAll ? "Marking..." : "Mark all as read"}
        </button>
      </header>

      <div className="rn-panel grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Status
          <select
            value={status}
            onChange={(event) => setFilter({ status: event.target.value, page: 1 })}
            className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold tracking-wide text-rn-muted uppercase">
          Type
          <select
            value={type}
            onChange={(event) => setFilter({ type: event.target.value, page: 1 })}
            className="mt-1 h-10 w-full rounded-lg border border-black/10 px-3 text-sm"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase())}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rn-panel h-20 animate-pulse bg-black/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rn-panel text-sm text-red-600">{error}</div>
      ) : data.items.length === 0 ? (
        <div className="rn-panel py-12 text-center">
          <p className="text-3xl">🔔</p>
          <p className="mt-2 font-semibold text-rn-ink">No notifications yet.</p>
          <p className="mt-1 text-sm text-rn-muted">
            Important updates about your listings, inquiries, messages, and account will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <article
              key={item.id}
              className={cn(
                "rn-panel transition hover:border-rn-gold/40",
                !item.isRead && "border-rn-gold/50 bg-rn-gold/5"
              )}
            >
              <button
                type="button"
                onClick={() => void onOpen(item.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-rn-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-rn-muted">{item.message}</p>
                  <p className="mt-2 text-xs text-rn-muted">
                    {item.type.replaceAll("_", " ")} · {formatRelativeViewedAt(item.createdAt)}
                  </p>
                </div>
                {openingId === item.id ? (
                  <Loader2 className="mt-1 size-4 shrink-0 animate-spin text-rn-gold" />
                ) : null}
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-rn-muted">
        <p>{data.total} notifications</p>
        <div className="flex gap-2">
          {page > 1 ? (
            <button
              type="button"
              onClick={() => setFilter({ page: page - 1 })}
              className="rn-btn-secondary h-9 px-3 text-xs"
            >
              Previous
            </button>
          ) : null}
          {page < data.totalPages ? (
            <button
              type="button"
              onClick={() => setFilter({ page: page + 1 })}
              className="rn-btn-secondary h-9 px-3 text-xs"
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
