-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'NEW_INQUIRY',
  'NEW_MESSAGE',
  'MACHINE_APPROVED',
  'MACHINE_REJECTED',
  'NEW_REVIEW',
  'ACCOUNT_UPDATE'
);

-- CreateEnum
CREATE TYPE "RelatedEntityType" AS ENUM (
  'MACHINE',
  'INQUIRY',
  'CONVERSATION',
  'REVIEW',
  'USER',
  'REPORT'
);

-- CreateTable
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "relatedEntityId" TEXT,
  "relatedEntityType" "RelatedEntityType",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
