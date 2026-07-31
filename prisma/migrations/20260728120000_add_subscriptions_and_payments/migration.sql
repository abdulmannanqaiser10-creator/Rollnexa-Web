-- Subscription & Payment enums
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL', 'STRIPE', 'PAYPAL', 'RAZORPAY');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'DEBIT_CARD', 'WALLET', 'BANK_TRANSFER', 'OTHER');

-- Extend notification enums
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_ACTIVATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_RENEWED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_SUCCESSFUL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INVOICE_READY';

ALTER TYPE "RelatedEntityType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION';
ALTER TYPE "RelatedEntityType" ADD VALUE IF NOT EXISTS 'PAYMENT';

-- Profile dealer flag
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "isDealerProfile" BOOLEAN NOT NULL DEFAULT false;

-- SubscriptionPlan
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "maxListings" INTEGER,
    "featuredListings" INTEGER NOT NULL DEFAULT 0,
    "homepageFeatured" BOOLEAN NOT NULL DEFAULT false,
    "premiumBadge" BOOLEAN NOT NULL DEFAULT false,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "dealerProfile" BOOLEAN NOT NULL DEFAULT false,
    "topSearchPriority" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");
CREATE INDEX "SubscriptionPlan_isActive_sortOrder_idx" ON "SubscriptionPlan"("isActive", "sortOrder");

-- UserSubscription
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "remainingListings" INTEGER,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserSubscription_userId_status_idx" ON "UserSubscription"("userId", "status");
CREATE INDEX "UserSubscription_status_expiryDate_idx" ON "UserSubscription"("status", "expiryDate");
CREATE INDEX "UserSubscription_planId_idx" ON "UserSubscription"("planId");

ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "planId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CARD',
    "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'MANUAL',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "invoiceNumber" TEXT,
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_paymentId_key" ON "Payment"("paymentId");
CREATE UNIQUE INDEX "Payment_invoiceNumber_key" ON "Payment"("invoiceNumber");
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");
CREATE INDEX "Payment_paymentStatus_createdAt_idx" ON "Payment"("paymentStatus", "createdAt");
CREATE INDEX "Payment_planId_idx" ON "Payment"("planId");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
