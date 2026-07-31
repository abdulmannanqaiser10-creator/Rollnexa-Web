import type { PaymentProviderAdapter } from "../types";

export const stripePaymentProvider: PaymentProviderAdapter = {
  id: "stripe",

  async createCheckoutSession(input) {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      throw new Error(
        "Stripe is not configured. Set STRIPE_SECRET_KEY or use manual payments."
      );
    }

    return {
      provider: "stripe",
      paymentId: input.paymentId,
      checkoutUrl: `/seller/subscription/checkout?payment=${input.paymentId}&provider=stripe`,
    };
  },

  async verifyPayment() {
    throw new Error(
      "Stripe verification requires webhook integration. Configure STRIPE_WEBHOOK_SECRET."
    );
  },

  async verifyWebhook() {
    throw new Error("Stripe webhook handler is not configured in this environment.");
  },
};
