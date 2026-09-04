import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getSellerPayments } from "@/lib/payments/service";
import { getSellerSubscriptionView } from "@/lib/subscriptions/service";
import { SubscriptionOverview } from "@/components/subscriptions/SubscriptionOverview";
import { PaymentHistoryTable } from "@/components/subscriptions/PaymentHistoryTable";

export const metadata = { title: "Payments — Rollnexa Seller" };

export default async function SellerPaymentsPage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login?callbackUrl=/seller/payments");

  const [payments, subscription] = await Promise.all([
    getSellerPayments(session.user.id),
    getSellerSubscriptionView(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280] uppercase">
          Business
        </p>
        <h1 className="font-display text-3xl font-bold text-[#111827]">Payments & Invoices</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Review your subscription payments, invoices, and transaction history.
        </p>
      </div>

      <SubscriptionOverview subscription={subscription} />
      <PaymentHistoryTable payments={payments} />
    </div>
  );
}
