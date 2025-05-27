-- AlterEnum
ALTER TYPE "HearingStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Hearing" ADD COLUMN     "agenda" JSONB,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "minutes" JSONB,
ADD COLUMN     "startedAt" TIMESTAMP(3);
