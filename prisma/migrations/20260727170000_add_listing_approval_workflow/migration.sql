-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Machine" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Machine" ADD COLUMN "rejectedById" TEXT;
ALTER TABLE "Machine" ADD COLUMN "submittedForReviewAt" TIMESTAMP(3);
ALTER TABLE "Machine" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Machine" ADD COLUMN "approvedById" TEXT;

-- CreateIndex
CREATE INDEX "Machine_status_submittedForReviewAt_idx" ON "Machine"("status", "submittedForReviewAt");

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
