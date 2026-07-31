import Link from "next/link";

type PaymentRow = {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string | null;
  invoiceNumber: string | null;
  paidAt: string | Date | null;
  createdAt: string | Date;
  plan: { name: string; slug: string };
};

type PaymentHistoryTableProps = {
  payments: PaymentRow[];
};

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-10 text-center text-sm text-[#6B7280]">
        No payments yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-[#F9FAFB] text-left">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Transaction</th>
            <th className="px-4 py-3">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-black/5">
              <td className="px-4 py-3 text-[#6B7280]">
                {new Date(payment.paidAt || payment.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-medium text-[#111827]">{payment.plan.name}</td>
              <td className="px-4 py-3">{payment.currency} {payment.amount.toFixed(2)}</td>
              <td className="px-4 py-3">{payment.paymentMethod.replaceAll("_", " ")}</td>
              <td className="px-4 py-3">{payment.paymentStatus}</td>
              <td className="px-4 py-3 font-mono text-xs">{payment.transactionId || "—"}</td>
              <td className="px-4 py-3">
                <Link href={`/seller/payments/${payment.id}`} className="font-medium text-[#B8860B] hover:underline">
                  {payment.invoiceNumber || "View"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
