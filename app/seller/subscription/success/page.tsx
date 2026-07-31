import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Payment Successful — Rollnexa Seller" };

type SearchParams = Promise<{ payment?: string }>;

export default async function SellerSubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const params = await searchParams;
  const payment = params.payment
    ? await prisma.payment.findFirst({
        where: { id: params.payment, userId: session.user.id },
        include: { plan: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
      <h1 className="mt-4 font-display text-2xl font-bold text-[#111827]">Payment Successful</h1>
      <p className="mt-2 text-sm text-[#6B7280]">
        {payment
          ? `Your ${payment.plan.name} subscription is now active.`
          : "Your subscription has been activated."}
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
