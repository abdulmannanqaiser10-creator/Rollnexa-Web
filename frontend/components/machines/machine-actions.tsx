"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  Link2,
  MessageSquare,
  Share2,
} from "lucide-react";
import type { MachineDetail } from "@/lib/machines/detail";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { CompareButton } from "@/components/compare/compare-button";
import { StartConversationButton } from "@/components/messages/start-conversation-button";

type MachineActionsProps = {
  machine: MachineDetail;
  isAuthenticated: boolean;
};

export function MachineActions({ machine, isAuthenticated }: MachineActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [inquiryPending, setInquiryPending] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  function requireAuth() {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  async function onSendInquiry(event: React.FormEvent) {
    event.preventDefault();
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    setInquiryError(null);
    setInquirySuccess(null);
    setInquiryPending(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId: machine.id, message }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setInquiryError(result?.error || "Unable to send inquiry");
        return;
      }
      setInquirySuccess("Inquiry sent successfully.");
      setMessage("");
    } catch {
      setInquiryError("Unable to send inquiry. Please try again.");
    } finally {
      setInquiryPending(false);
    }
  }

  async function onShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://rollnexa.com/machines/${machine.slug}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: machine.title,
          text: `Check out this ${machine.title} on Rollnexa`,
          url,
        });
        setShareFeedback("Shared");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Link copied");
      } else {
        setShareFeedback("Copy this page URL to share");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Link copied");
      } catch {
        setShareFeedback("Unable to share right now");
      }
    }

    window.setTimeout(() => setShareFeedback(null), 2500);
  }

  async function onCopyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback("Link copied");
    } catch {
      setShareFeedback("Unable to copy link");
    }
    window.setTimeout(() => setShareFeedback(null), 2500);
  }

  return (
    <div id="contact-seller" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <StartConversationButton
          machineId={machine.id}
          isAuthenticated={isAuthenticated}
          label="Contact Seller"
        />
        <FavoriteButton
          machineId={machine.id}
          initialFavorited={machine.isFavorited}
          isAuthenticated={isAuthenticated}
        />
        <CompareButton
          machine={{
            id: machine.id,
            slug: machine.slug,
            title: machine.title,
            priceLabel: machine.priceLabel,
            brandName: machine.brand.name,
            year: machine.year,
            imageUrl: machine.images[0]?.url ?? null,
            categoryName: machine.category.name,
            condition: machine.conditionLabel,
            location: machine.location,
          }}
        />
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rn-ink/10 bg-white px-4 text-sm font-semibold text-rn-ink hover:border-rn-gold"
        >
          <Share2 className="size-4" />
          Share
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            requireAuth();
            return;
          }
          setInquiryOpen(true);
          setInquiryError(null);
          setInquirySuccess(null);
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rn-muted hover:text-rn-ink"
      >
        <MessageSquare className="size-3.5" />
        Or send a one-time inquiry
      </button>

      <button
        type="button"
        onClick={onCopyLink}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rn-muted hover:text-rn-ink"
      >
        <Link2 className="size-3.5" />
        Copy listing link
      </button>

      {shareFeedback ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-rn-ink">
          <Check className="size-3.5 text-rn-gold" />
          {shareFeedback}
        </p>
      ) : null}

      {inquiryOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close inquiry form"
            onClick={() => setInquiryOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 max-h-[90dvh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-display text-xl font-bold text-rn-ink">
                Contact Seller
              </h3>
              <p className="mt-1 text-sm text-rn-muted">
                Enquiring about:{" "}
                <span className="font-medium text-rn-ink">{machine.title}</span>
              </p>
            </div>

            {inquirySuccess ? (
              <div className="rounded-xl bg-emerald-50 p-5 text-center">
                <p className="font-semibold text-emerald-800">
                  Inquiry sent successfully!
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  The seller will be able to review your message.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInquiryOpen(false);
                    setInquirySuccess(null);
                  }}
                  className="mt-4 inline-flex h-10 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={onSendInquiry} className="space-y-4">
                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="mb-1.5 block text-xs font-semibold text-rn-ink"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="inquiry-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                    minLength={10}
                    maxLength={2000}
                    placeholder="I'm interested in this machine. Is it still available? What is the final price?"
                    className="w-full rounded-lg border border-black/10 bg-rn-surface px-3 py-2.5 text-sm outline-none focus:border-rn-gold"
                  />
                  <p className="mt-1 text-right text-xs text-rn-muted">
                    {message.length}/2000
                  </p>
                </div>

                {inquiryError ? (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {inquiryError}
                  </p>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInquiryOpen(false)}
                    className="h-11 flex-1 rounded-lg border border-black/10 text-sm font-semibold text-rn-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inquiryPending || message.trim().length < 10}
                    className="h-11 flex-1 rounded-lg bg-rn-gold text-sm font-bold text-rn-ink disabled:opacity-60"
                  >
                    {inquiryPending ? "Sending..." : "Send Inquiry"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
