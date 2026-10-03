"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentStatusRefresh({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/seller/payments/${paymentId}`, { cache: "no-store" }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (!stopped && data?.payment?.paymentStatus === "SUCCESS") { stopped = true; router.refresh(); window.clearInterval(timer); }
    }, 3000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [paymentId, router]);
  return null;
}
