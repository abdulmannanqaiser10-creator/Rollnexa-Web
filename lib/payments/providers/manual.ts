import type { PaymentProviderAdapter } from "../types";

export const manualPaymentProvider: PaymentProviderAdapter = {
  id: "manual",

  async createCheckoutSession(input) {
    return {
      provider: "manual",
      paymentId: input.paymentId,
      checkoutUrl: `/seller/subscription/checkout?payment=${input.paymentId}`,
      requiresManualConfirmation: true,
    };
  },

  async verifyPayment(paymentId) {
    return {
      success: true,
      transactionId: `manual_${paymentId.slice(0, 8)}`,
    };
  },
};
