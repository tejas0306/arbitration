/*
  Warnings:

  - You are about to drop the column `mobile` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Arbitration" ADD COLUMN     "disputeDescription" TEXT,
ADD COLUMN     "natureOfDispute" TEXT,
ADD COLUMN     "paymentAmount" TEXT,
ADD COLUMN     "paymentDetails" TEXT,
ALTER COLUMN "arguments" SET DATA TYPE TEXT,
ALTER COLUMN "prayers" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."CaseResponse" ADD COLUMN     "responseData" JSONB,
ADD COLUMN     "round" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "responseOverview" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "mobile",
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "public"."WorkflowRound" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "roundType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT NOT NULL,
    "assignedRole" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FieldResponse" (
    "id" TEXT NOT NULL,
    "caseResponseId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "respondentComment" TEXT,
    "correctedValue" TEXT,
    "evidence" JSONB,
    "round" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIJudgment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "judgment" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIJudgment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FieldResponse_caseId_respondentId_fieldId_round_key" ON "public"."FieldResponse"("caseId", "respondentId", "fieldId", "round");

-- AddForeignKey
ALTER TABLE "public"."WorkflowRound" ADD CONSTRAINT "WorkflowRound_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FieldResponse" ADD CONSTRAINT "FieldResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIJudgment" ADD CONSTRAINT "AIJudgment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
