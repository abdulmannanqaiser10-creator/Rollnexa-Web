import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/payments/service";
import { checkoutSchema } from "@/lib/validations/subscription";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid checkout data" },
        { status: 400 }
      );
    }

    const result = await createSubscriptionCheckout({
      userId: session.user.id,
      planSlug: parsed.data.planSlug,
      provider: parsed.data.provider,
      paymentMethod: parsed.data.paymentMethod,
      renew: parsed.data.renew,
    });

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: result.payment.id,
        paymentId: result.payment.paymentId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        invoiceNumber: result.payment.invoiceNumber,
        plan: result.payment.plan,
      },
      checkout: result.session,
    });
  } catch (error) {
    console.error("[api/seller/subscription/checkout] POST failed:", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
