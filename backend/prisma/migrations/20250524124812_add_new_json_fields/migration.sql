-- AlterTable
ALTER TABLE "Arbitration" ADD COLUMN     "arguments" JSONB,
ADD COLUMN     "formData" JSONB,
ADD COLUMN     "managerDetails" JSONB,
ADD COLUMN     "payment" JSONB,
ADD COLUMN     "prayers" JSONB;
