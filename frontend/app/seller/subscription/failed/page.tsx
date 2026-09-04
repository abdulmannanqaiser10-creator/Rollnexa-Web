import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata = { title: "Payment Failed — Rollnexa Seller" };

export default function SellerSubscriptionFailedPage() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <XCircle className="mx-auto size-12 text-red-600" />
      <h1 className="mt-4 font-display text-2xl font-bold text-[#111827]">Payment Failed</h1>
      <p className="mt-2 text-sm text-[#6B7280]">
        Your payment could not be completed. No subscription changes were applied.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/seller/subscription" className="inline-flex h-10 items-center rounded-xl bg-[#F5B800] px-4 text-sm font-bold text-[#080D12]">
          Try Again
        </Link>
        <Link href="/seller/payments" className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#111827]">
          Payment History
        </Link>
      </div>
    </div>
  );
}
