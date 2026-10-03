import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { completePayment, getPaymentForUser } from "@/lib/payments/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const payment = await getPaymentForUser(id, session.user.id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("[api/seller/payments/id] GET failed:", error);
    return NextResponse.json({ error: "Unable to load payment" }, { status: 500 });
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const result = await completePayment({
      paymentDbId: id,
      userId: session.user.id,
    });

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      alreadyCompleted: "alreadyCompleted" in result ? result.alreadyCompleted : false,
    });
  } catch (error) {
    console.error("[api/seller/payments/id] POST failed:", error);
    return NextResponse.json({ error: "Unable to complete payment" }, { status: 500 });
  }
}
