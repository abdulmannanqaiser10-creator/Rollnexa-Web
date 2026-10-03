export type PaymentProviderId = "manual" | "stripe" | "paypal" | "razorpay" | "safepay";

export type CheckoutSessionInput = {
  paymentId: string;
  userId: string;
  planSlug: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CheckoutSessionResult = {
  provider: PaymentProviderId;
  paymentId: string;
  checkoutUrl?: string;
  clientSecret?: string;
  requiresManualConfirmation?: boolean;
};

export type PaymentVerificationResult = {
  success: boolean;
  transactionId?: string;
  receiptUrl?: string;
  failureReason?: string;
};

export interface PaymentProviderAdapter {
  id: PaymentProviderId;
  createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionResult>;
  verifyPayment(paymentId: string): Promise<PaymentVerificationResult>;
  verifyWebhook?(
    request: Request
  ): Promise<{ paymentId: string; success: boolean; transactionId?: string; amount?: number; currency?: string }>;
}
