import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProviderAdapter } from "../types";

type SafepayEnvironment = "sandbox" | "production";
const API_BASES: Record<SafepayEnvironment, string> = {
  sandbox: "https://sandbox.api.getsafepay.com",
  production: "https://api.getsafepay.com",
};
const CHECKOUT_BASES: Record<SafepayEnvironment, string> = {
  sandbox: "https://sandbox.api.getsafepay.com/checkout/pay",
  production: "https://getsafepay.com/checkout/pay",
};

function environment(): SafepayEnvironment {
  const configured = (process.env.SAFEPAY_ENVIRONMENT || "sandbox").trim().toLowerCase();
  if (configured !== "sandbox" && configured !== "production") {
    throw new Error("SAFEPAY_ENVIRONMENT must be sandbox or production.");
  }
  return configured;
}

function credentials() {
  const apiKey = process.env.SAFEPAY_API_KEY?.trim();
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET?.trim();
  if (!apiKey) throw new Error("Safepay is not configured. Set SAFEPAY_API_KEY.");
  if (!webhookSecret) throw new Error("Safepay webhook secret is not configured.");
  return { apiKey, webhookSecret };
}

export const safePayPaymentProvider: PaymentProviderAdapter = {
  id: "safepay",
  async createCheckoutSession(input) {
    if (input.currency !== "PKR") throw new Error("Safepay checkout requires PKR prices.");
    const { apiKey } = credentials();
    const env = environment();
    // The legacy /order/v1/init endpoint used here takes PKR in rupees.
    // Our plans are already stored in rupees; sending paisa makes the hosted
    // checkout display the amount 100 times too high.
    const amountInRupees = Math.round(input.amount);
    if (!Number.isSafeInteger(amountInRupees) || amountInRupees <= 0) throw new Error("Invalid Safepay amount.");

    const response = await fetch(`${API_BASES[env]}/order/v1/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountInRupees, client: apiKey, currency: input.currency, environment: env }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json().catch(() => null) as { data?: { token?: string }; status?: { message?: string } } | null;
    if (!response.ok || typeof result?.data?.token !== "string") {
      throw new Error("Safepay could not create a checkout session. Check the merchant key and environment.");
    }

    const checkout = new URL(CHECKOUT_BASES[env]);
    checkout.search = new URLSearchParams({
      beacon: result.data.token,
      cancel_url: input.cancelUrl,
      env,
      order_id: input.metadata?.internalPaymentReference || input.paymentId,
      redirect_url: input.successUrl,
      source: "custom",
      webhooks: "true",
    }).toString();
    return { provider: "safepay", paymentId: input.paymentId, checkoutUrl: checkout.toString() };
  },
  async verifyPayment() {
    return { success: false, failureReason: "Safepay confirmation requires a signed webhook." };
  },
  async verifyWebhook(request) {
    const { webhookSecret } = credentials();
    const supplied = request.headers.get("x-sfpy-signature") || "";
    const rawBody = await request.text();
    if (rawBody.length > 1_000_000) throw new Error("Safepay webhook payload is too large.");
    const parsed = JSON.parse(rawBody) as { data?: unknown };
    if (!parsed.data || typeof parsed.data !== "object") throw new Error("Invalid Safepay webhook payload.");

    // This matches Safepay's official Node SDK: HMAC-SHA512 of JSON.stringify(body.data).
    const signedData = Buffer.from(JSON.stringify(parsed.data));
    const expected = createHmac("sha512", webhookSecret).update(signedData).digest("hex");
    const receivedBytes = Buffer.from(supplied, "hex");
    const expectedBytes = Buffer.from(expected, "hex");
    if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) {
      throw new Error("Invalid Safepay webhook signature.");
    }

    const data = parsed.data as {
      notification?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      type?: unknown;
    };
    const notice = data.notification;
    if (!notice || typeof notice.reference !== "string") throw new Error("Safepay webhook is missing its payment reference.");
    const state = String(notice.state || "").toUpperCase();
    const amount = typeof notice.amount === "string" || typeof notice.amount === "number" ? Number(notice.amount) : NaN;
    const notificationMetadata = notice.metadata && typeof notice.metadata === "object"
      ? notice.metadata as Record<string, unknown>
      : undefined;
    const orderId = notificationMetadata?.order_id ?? data.metadata?.order_id;
    return {
      // Safepay's reference is its own transaction reference. The merchant's
      // internal order id is echoed in notification.metadata.order_id.
      paymentId: typeof orderId === "string" && orderId ? orderId : notice.reference,
      success: state === "PAID" && Number.isFinite(amount) && typeof notice.currency === "string",
      transactionId: typeof notice.tracker === "string" ? notice.tracker : undefined,
      amount,
      currency: typeof notice.currency === "string" ? notice.currency : undefined,
    };
  },
};
