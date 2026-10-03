import { NextResponse } from "next/server";
import { createSubscriptionCheckout } from "@/lib/payments/service";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations/subscription";
import { checkRateLimit, enforceRequestSize, requireApiSession, validateBody, assertSameOrigin, rateLimitResponse } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const originCheck = assertSameOrigin(request);
    if (!originCheck.ok) return originCheck.response;

    const sizeCheck = await enforceRequestSize(request);
    if (!sizeCheck.ok) {
      return sizeCheck.response;
    }

    const rateLimit = checkRateLimit(request, "subscription-checkout", 10, 60_000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const { session, response } = await requireApiSession("SELLER");
    if (response) return response;

    const body = await request.json().catch(() => null);
    const parsed = validateBody(checkoutSchema, body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid checkout data" },
        { status: 400 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id }, select: { phone: true } });
    const result = await createSubscriptionCheckout({
      userId: session.user.id,
      planSlug: parsed.data.planSlug,
      billingCycle: parsed.data.billingCycle,
      provider: parsed.data.provider,
      paymentMethod: parsed.data.paymentMethod,
      renew: parsed.data.renew,
      customerEmail: session.user.email,
      customerName: session.user.name ?? undefined,
      customerPhone: profile?.phone ?? undefined,
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
