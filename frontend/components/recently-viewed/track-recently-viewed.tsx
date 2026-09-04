"use client";

import { useEffect } from "react";

type TrackRecentlyViewedProps = {
  machineId: string;
  enabled: boolean;
};

/**
 * Fire-and-forget tracker. Failures must never affect machine details UX.
 */
export function TrackRecentlyViewed({
  machineId,
  enabled,
}: TrackRecentlyViewedProps) {
  useEffect(() => {
    if (!enabled || !machineId) return;

    let cancelled = false;

    async function track() {
      try {
        await fetch("/api/recently-viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ machineId }),
        });
      } catch (error) {
        if (!cancelled) {
          console.error("[recently-viewed] track failed:", error);
        }
      }
    }

    track();

    return () => {
      cancelled = true;
    };
  }, [enabled, machineId]);

  return null;
}
