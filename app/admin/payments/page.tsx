import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { listAdminPayments } from "@/lib/payments/service";

export const metadata = { title: "Payments — Rollnexa Admin" };

export default async function AdminPaymentsPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login?callbackUrl=/admin/payments");

  const payments = await listAdminPayments();

  return (
    <div className="space-y-6">
      <div>
        <p className="rn-eyebrow">Billing</p>
        <h1 className="rn-page-title">Payments</h1>
        <p className="mt-2 text-sm text-rn-muted">
          Review subscription payments, transaction status, and revenue activity.
        </p>
      </div>

      <div className="rn-panel overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Seller</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-black/5">
                <td className="px-3 py-3">{new Date(payment.createdAt).toLocaleString()}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-rn-ink">{payment.user.name || "Seller"}</div>
                  <div className="text-xs text-rn-muted">{payment.user.email}</div>
                </td>
                <td className="px-3 py-3">{payment.plan.name}</td>
                <td className="px-3 py-3">{payment.currency} {payment.amount.toFixed(2)}</td>
                <td className="px-3 py-3">{payment.paymentStatus}</td>
                <td className="px-3 py-3 font-mono text-xs">{payment.transactionId || payment.paymentId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
