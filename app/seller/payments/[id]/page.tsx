import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getPaymentForUser } from "@/lib/payments/service";

export const metadata = { title: "Invoice — Rollnexa Seller" };

type RouteContext = { params: Promise<{ id: string }> };

export default async function SellerPaymentInvoicePage({ params }: RouteContext) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const { id } = await params;
  const payment = await getPaymentForUser(id, session.user.id);
  if (!payment) redirect("/seller/payments");

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280] uppercase">Invoice</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-[#111827]">
            {payment.invoiceNumber || payment.paymentId}
          </h1>
        </div>
        <span className="rounded-full bg-[#F9FAFB] px-3 py-1 text-xs font-semibold text-[#111827]">
          {payment.paymentStatus}
        </span>
      </div>

      <div className="mt-8 space-y-3 text-sm">
        <div className="flex justify-between border-b border-black/5 py-3"><span className="text-[#6B7280]">Plan</span><span className="font-semibold">{payment.plan.name}</span></div>
        <div className="flex justify-between border-b border-black/5 py-3"><span className="text-[#6B7280]">Amount</span><span className="font-semibold">{payment.currency} {payment.amount.toFixed(2)}</span></div>
        <div className="flex justify-between border-b border-black/5 py-3"><span className="text-[#6B7280]">Payment Method</span><span className="font-semibold">{payment.paymentMethod.replaceAll("_", " ")}</span></div>
        <div className="flex justify-between border-b border-black/5 py-3"><span className="text-[#6B7280]">Transaction ID</span><span className="font-mono text-xs">{payment.transactionId || "—"}</span></div>
        <div className="flex justify-between border-b border-black/5 py-3"><span className="text-[#6B7280]">Paid At</span><span className="font-semibold">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Pending"}</span></div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/seller/payments" className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#111827]">
          Back to Payments
        </Link>
      </div>
    </div>
  );
}
