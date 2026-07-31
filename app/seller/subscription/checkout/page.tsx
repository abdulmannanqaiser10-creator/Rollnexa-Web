import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CheckoutClient } from "@/components/subscriptions/CheckoutClient";

export const metadata = { title: "Checkout — Rollnexa Seller" };

type SearchParams = Promise<{ payment?: string }>;

export default async function SellerSubscriptionCheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login?callbackUrl=/seller/subscription");

  const params = await searchParams;
  if (!params.payment) redirect("/seller/subscription");

  const payment = await prisma.payment.findFirst({
    where: { id: params.payment, userId: session.user.id },
    include: { plan: true },
  });

  if (!payment) redirect("/seller/subscription");

  return (
    <CheckoutClient
      paymentId={payment.id}
      planName={payment.plan.name}
      amount={payment.amount}
      currency={payment.currency}
      invoiceNumber={payment.invoiceNumber}
    />
  );
}
