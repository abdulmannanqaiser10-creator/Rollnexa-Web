import type { PaymentProviderAdapter } from "../types";

function isManualPaymentsAllowed() {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ALLOW_MANUAL_PAYMENTS === "true";
}

export const manualPaymentProvider: PaymentProviderAdapter = {
  id: "manual",

  async createCheckoutSession(input) {
    if (!isManualPaymentsAllowed()) {
      throw new Error(
        "Manual payments are disabled in production. Configure Stripe or set ALLOW_MANUAL_PAYMENTS=true."
      );
    }

    return {
      provider: "manual",
      paymentId: input.paymentId,
      checkoutUrl: `/seller/subscription/checkout?payment=${input.paymentId}`,
      requiresManualConfirmation: true,
    };
  },

  async verifyPayment(paymentId) {
    if (!isManualPaymentsAllowed()) {
      return {
        success: false,
        failureReason: "Manual payment verification is disabled in production.",
      };
    }

    return {
      success: true,
      transactionId: `manual_${paymentId.slice(0, 8)}`,
    };
  },
};
