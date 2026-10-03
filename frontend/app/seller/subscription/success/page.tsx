import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PaymentStatusRefresh } from "@/components/subscriptions/PaymentStatusRefresh";

export const metadata = { title: "Payment Successful — Rollnexa Seller" };

type SearchParams = Promise<{
  payment?: string | string[];
  order_id?: string | string[];
}>;

export default async function SellerSubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const params = await searchParams;
  const first = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
  // Older Safepay sessions appended order_id inside the payment query value.
  // Accept both formats, but only query Prisma with a valid Mongo ObjectId.
  const rawPaymentId = first(params.order_id) || first(params.payment) || "";
  const paymentId = rawPaymentId.split(/[?&]/, 1)[0];
  const payment = /^[a-f\d]{24}$/i.test(paymentId)
    ? await prisma.payment.findFirst({
        where: { id: paymentId, userId: session.user.id },
        include: { plan: true, subscription: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
      {payment && payment.paymentStatus !== "SUCCESS" ? <PaymentStatusRefresh paymentId={payment.id} /> : null}
      {payment?.paymentStatus === "SUCCESS" && payment.subscription ? <CheckCircle2 className="mx-auto size-12 text-emerald-600" /> : <Clock3 className="mx-auto size-12 text-amber-500" />}
      <h1 className="mt-4 font-display text-2xl font-bold text-[#111827]">{payment?.paymentStatus === "SUCCESS" && payment.subscription ? "Payment Successful" : "Payment Processing"}</h1>
      <p className="mt-2 text-sm text-[#6B7280]">
        {payment?.paymentStatus === "SUCCESS" && payment.subscription
          ? `Your ${payment.plan.name} subscription is now active.`
          : "We are confirming your payment. Your subscription will activate after the payment provider confirms it."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/seller/dashboard" className="inline-flex h-10 items-center rounded-xl bg-[#F5B800] px-4 text-sm font-bold text-[#080D12]">
          Go to Dashboard
        </Link>
        <Link href="/seller/payments" className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#111827]">
          View Payment History
        </Link>
      </div>
    </div>
  );
}
