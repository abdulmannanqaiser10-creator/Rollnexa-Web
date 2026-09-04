"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

type CheckoutClientProps = {
  paymentId: string;
  planName: string;
  amount: number;
  currency: string;
  invoiceNumber: string | null;
};

export function CheckoutClient({
  paymentId,
  planName,
  amount,
  currency,
  invoiceNumber,
}: CheckoutClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completePayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seller/payments/${paymentId}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Payment failed");
        return;
      }
      window.location.href = `/seller/subscription/success?payment=${paymentId}`;
    } catch {
      setError("Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex size-12 items-center justify-center rounded-xl bg-[#F5B800]/15 text-[#B8860B]">
          <ShieldCheck className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#111827]">Secure Checkout</h1>
          <p className="text-sm text-[#6B7280]">Complete your subscription payment</p>
        </div>
      </div>

      <div className="space-y-3 rounded-xl bg-[#F9FAFB] p-4 text-sm">
        <div className="flex justify-between"><span className="text-[#6B7280]">Plan</span><span className="font-semibold text-[#111827]">{planName}</span></div>
        <div className="flex justify-between"><span className="text-[#6B7280]">Amount</span><span className="font-semibold text-[#111827]">{currency} {amount.toFixed(2)}</span></div>
        {invoiceNumber ? <div className="flex justify-between"><span className="text-[#6B7280]">Invoice</span><span className="font-semibold text-[#111827]">{invoiceNumber}</span></div> : null}
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <button
        type="button"
        disabled={loading}
        onClick={completePayment}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#F5B800] text-sm font-bold text-[#080D12] disabled:opacity-60"
      >
        {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Processing...</> : "Confirm Payment"}
      </button>

      <Link href="/seller/subscription/failed" className="mt-3 block text-center text-sm text-[#6B7280] hover:text-[#111827]">
        Cancel checkout
      </Link>
    </div>
  );
}
