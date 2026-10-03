import { NextResponse } from "next/server";
import { completeSafepayWebhook } from "@/lib/payments/service";

export async function POST(request: Request) {
  try {
    const result = await completeSafepayWebhook(request);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[payments/safepay/webhook] rejected", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Invalid payment notification" }, { status: 400 });
  }
}
