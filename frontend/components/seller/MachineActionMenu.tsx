"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  Eye,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Rocket,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MachineActionMenuProps = {
  machineId: string;
  machineSlug: string;
  machineTitle?: string;
  status: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type MenuCoords = {
  top: number;
  left: number;
};

const MENU_WIDTH = 220;

export function MachineActionMenu({
  machineId,
  machineSlug,
  machineTitle,
  status,
}: MachineActionMenuProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<
    "delete" | "sold" | "archive" | "submit" | null
  >(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "archive" | null
  >(null);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updatePosition() {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight || 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

    const top = openUp
      ? Math.max(8, rect.top - menuHeight - 8)
      : Math.min(rect.bottom + 8, window.innerHeight - menuHeight - 8);

    setCoords({ top, left });
  }

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
    const frame = window.requestAnimationFrame(() => updatePosition());

    function onReposition() {
      updatePosition();
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onDelete() {
    if (pending) return;

    setPending("delete");
    setOpen(false);

    try {
      const response = await fetch(`/api/seller/machines/${machineId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("[seller/machines] delete failed:", result);
        setToast({
          type: "error",
          message: result?.error || "Failed to delete machine. Please try again.",
        });
        return;
      }

      setToast({ type: "success", message: "Machine deleted successfully." });
      router.refresh();
    } catch (error) {
      console.error("[seller/machines] delete request error:", error);
      setToast({
        type: "error",
        message: "Failed to delete machine. Please try again.",
      });
    } finally {
      setPending(null);
    }
  }

  async function onMarkSold() {
    if (pending) return;

    setPending("sold");
    setOpen(false);

    try {
      const response = await fetch(`/api/seller/machines/${machineId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("[seller/machines] mark sold failed:", result);
        setToast({
          type: "error",
          message: result?.error || "Failed to update machine status.",
        });
        return;
      }

      setToast({ type: "success", message: "Machine marked as sold." });
      router.refresh();
    } catch (error) {
      console.error("[seller/machines] mark sold request error:", error);
      setToast({
        type: "error",
        message: "Failed to update machine status.",
      });
    } finally {
      setPending(null);
    }
  }

  async function onSubmitForApproval() {
    if (pending) return;
    setPending("submit");
    setOpen(false);
    try {
      const response = await fetch(`/api/seller/machines/${machineId}/submit`, {
        method: "POST",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setToast({
          type: "error",
          message: result?.error || "Failed to submit listing for approval.",
        });
        return;
      }
      setToast({ type: "success", message: "Listing submitted for approval." });
      router.refresh();
    } catch (error) {
      console.error("[seller/machines] submit request error:", error);
      setToast({ type: "error", message: "Failed to submit listing for approval." });
    } finally {
      setPending(null);
    }
  }
  async function onSetStatus(
    nextStatus: "DRAFT" | "SOLD" | "ARCHIVED",
    pendingKey: "sold" | "archive",
    successMessage: string
  ) {
    if (pending) return;
    setPending(pendingKey);
    setOpen(false);

    try {
      const response = await fetch(`/api/seller/machines/${machineId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setToast({
          type: "error",
          message: result?.error || "Failed to update machine status.",
        });
        return;
      }
      setToast({ type: "success", message: successMessage });
      router.refresh();
    } catch (error) {
      console.error("[seller/machines] status update request error:", error);
      setToast({
        type: "error",
        message: "Failed to update machine status.",
      });
    } finally {
      setPending(null);
    }
  }

  const canPortal = typeof document !== "undefined";

  const menu =
    open && canPortal
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              width: MENU_WIDTH,
              visibility: coords ? "visible" : "hidden",
            }}
            className="z-[100] rounded-xl border border-black/5 bg-white py-1 shadow-[0_16px_40px_rgba(8,13,18,0.16)]"
          >
            <Link
              href={`/machines/${machineSlug}`}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#111827] transition hover:bg-[#F6F7F9]"
              onClick={() => setOpen(false)}
            >
              <Eye className="size-4 shrink-0 text-[#F5B800]" />
              View Details
            </Link>
            <Link
              href={`/seller/machines/${machineId}/edit`}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#111827] transition hover:bg-[#F6F7F9]"
              onClick={() => setOpen(false)}
            >
              <Pencil className="size-4 shrink-0 text-[#F5B800]" />
              Edit Machine
            </Link>
            <Link
              href={`/seller/machines/${machineId}/edit`}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#111827] transition hover:bg-[#F6F7F9]"
              onClick={() => setOpen(false)}
            >
              <ImageIcon className="size-4 shrink-0 text-[#F5B800]" />
              Manage Images
            </Link>
            {status === "PUBLISHED" ? (
              <button
                type="button"
                role="menuitem"
                onClick={onMarkSold}
                disabled={pending !== null}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[#111827] transition hover:bg-[#F6F7F9] disabled:opacity-60"
              >
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                Mark as Sold
              </button>
            ) : null}
            {(status === "DRAFT" || status === "REJECTED") ? (
              <button
                type="button"
                role="menuitem"
                onClick={onSubmitForApproval}
                disabled={pending !== null}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[#111827] transition hover:bg-[#F6F7F9] disabled:opacity-60"
              >
                <Rocket className="size-4 shrink-0 text-indigo-600" />
                Submit for Approval
              </button>
            ) : null}
            {status !== "ARCHIVED" && status !== "PENDING_REVIEW" ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setConfirmAction("archive");
                }}
                disabled={pending !== null}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[#111827] transition hover:bg-[#F6F7F9] disabled:opacity-60"
              >
                <Archive className="size-4 shrink-0 text-slate-600" />
                Archive
              </button>
            ) : null}
            <div className="my-1 border-t border-black/5" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setConfirmAction("delete");
              }}
              disabled={pending !== null}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="size-4 shrink-0" />
              Delete Machine
            </button>
          </div>,
          document.body
        )
      : null;

  const confirmationDialog =
    confirmAction && canPortal
      ? createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close confirmation dialog"
              onClick={() => setConfirmAction(null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="machine-action-confirm-title"
              className="relative w-full max-w-md rounded-2xl border border-black/5 bg-white p-5 shadow-2xl"
            >
              <h3
                id="machine-action-confirm-title"
                className="font-display text-lg font-bold text-[#111827]"
              >
                {confirmAction === "delete"
                  ? "Delete this machine?"
                  : "Archive this machine?"}
              </h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                {confirmAction === "delete"
                  ? `This permanently removes "${machineTitle || "this listing"}". This action cannot be undone.`
                  : `This hides "${machineTitle || "this listing"}" from active inventory until republished.`}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="inline-flex h-10 items-center rounded-lg border border-black/10 px-4 text-sm font-semibold text-[#111827]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const action = confirmAction;
                    setConfirmAction(null);
                    if (action === "delete") {
                      void onDelete();
                      return;
                    }
                    void onSetStatus(
                      "ARCHIVED",
                      "archive",
                      "Machine archived successfully."
                    );
                  }}
                  className={cn(
                    "inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white",
                    confirmAction === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-slate-700 hover:bg-slate-800"
                  )}
                >
                  {confirmAction === "delete" ? "Delete Machine" : "Archive"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const toastNode =
    toast && canPortal
      ? createPortal(
          <div
            className={cn(
              "fixed right-4 bottom-4 z-[110] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg",
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {toast.message}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={pending !== null}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-2.5 text-sm font-semibold text-[#111827] transition hover:border-[#F5B800] disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {pending === "delete" ? (
          <>
            <Loader2 className="size-4 animate-spin text-red-600" />
            <span className="text-red-600">Deleting...</span>
          </>
        ) : pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <MoreHorizontal className="size-4" />
            <span className="hidden sm:inline">Actions</span>
          </>
        )}
      </button>
      {menu}
      {confirmationDialog}
      {toastNode}
    </div>
  );
}
