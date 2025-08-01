-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availabilityInfo" TEXT,
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "temporaryPassword" TEXT;
