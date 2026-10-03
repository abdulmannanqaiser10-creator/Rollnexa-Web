import type { PaymentProviderAdapter, PaymentProviderId } from "./types";
import { manualPaymentProvider } from "./providers/manual";
import { stripePaymentProvider } from "./providers/stripe";
import { safePayPaymentProvider } from "./providers/safepay";

const providers: Record<PaymentProviderId, PaymentProviderAdapter> = {
  manual: manualPaymentProvider,
  stripe: stripePaymentProvider,
  paypal: manualPaymentProvider,
  razorpay: manualPaymentProvider,
  safepay: safePayPaymentProvider,
};

export function getPaymentProvider(id: PaymentProviderId): PaymentProviderAdapter {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Payment provider "${id}" is not supported`);
  }
  return provider;
}

export function getDefaultPaymentProviderId(): PaymentProviderId {
  if (process.env.PAYMENT_PROVIDER === "safepay" && process.env.SAFEPAY_API_KEY?.trim()) return "safepay";
  if (process.env.STRIPE_SECRET_KEY?.trim()) return "stripe";
  return "manual";
}

export function resolveProviderId(value: string): PaymentProviderId {
  if (value === "stripe" || value === "paypal" || value === "razorpay" || value === "manual" || value === "safepay") {
    return value;
  }
  return getDefaultPaymentProviderId();
}
