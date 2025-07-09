/*
  Warnings:

  - The values [PENDING_APPROVAL,SUSPENDED] on the enum `ArbitratorStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [UNREAD,ARCHIVED] on the enum `NotificationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SYSTEM,ALERT,MESSAGE,ESCALATION] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CASE_MANAGER,TEAM_MEMBER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `archiveReason` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `archivedAt` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `archivedBy` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `assignedManagerId` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedCompletion` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `reviewNotes` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStatus` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `slaDeadline` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `workflowStatus` on the `Arbitration` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `CaseAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `arbitratorStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `documents` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isSuspended` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `managedCases` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `mobile` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `suspendedUntil` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `suspensionReason` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `teamMembers` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `temporaryPassword` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `hourlyRate` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the `Announcement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArbitratorAvailability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Award` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CaseNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CaseTimeline` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Hearing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QAReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reminder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkflowRule` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `caseNumber` on table `Arbitration` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `CaseAssignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ArbitratorProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProposedBy" AS ENUM ('CLAIMANT', 'RESPONDENT', 'SYSTEM', 'ADMIN');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CasePhase" AS ENUM ('NOTICE_SENT', 'RESPONSE_PENDING', 'RESPONSE_SUBMITTED', 'ARBITRATOR_SELECTION', 'EVIDENCE_PHASE', 'HEARING_PHASE', 'AWARD_PHASE', 'COMPLETED', 'APPEALED');

-- AlterEnum
BEGIN;
CREATE TYPE "ArbitratorStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
ALTER TYPE "ArbitratorStatus" RENAME TO "ArbitratorStatus_old";
ALTER TYPE "ArbitratorStatus_new" RENAME TO "ArbitratorStatus";
DROP TYPE "ArbitratorStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationStatus_new" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
ALTER TABLE "Notification" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RespondentCase" ALTER COLUMN "notificationStatus" TYPE "NotificationStatus_new" USING ("notificationStatus"::text::"NotificationStatus_new");
ALTER TABLE "CaseNotification" ALTER COLUMN "status" TYPE "NotificationStatus_new" USING ("status"::text::"NotificationStatus_new");
ALTER TYPE "NotificationStatus" RENAME TO "NotificationStatus_old";
ALTER TYPE "NotificationStatus_new" RENAME TO "NotificationStatus";
DROP TYPE "NotificationStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('CASE_NOTICE', 'ARBITRATOR_PROPOSAL', 'HEARING_SCHEDULE', 'AWARD_ISSUED', 'REMINDER', 'SYSTEM_MESSAGE');
ALTER TABLE "Notification" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "CaseNotification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('CLAIMANT', 'RESPONDENT', 'ARBITRATOR', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLAIMANT';
COMMIT;

-- DropForeignKey
ALTER TABLE "ArbitratorAvailability" DROP CONSTRAINT "ArbitratorAvailability_arbitratorId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_entityId_fkey";

-- DropForeignKey
ALTER TABLE "Award" DROP CONSTRAINT "Award_arbitratorId_fkey";

-- DropForeignKey
ALTER TABLE "Award" DROP CONSTRAINT "Award_caseId_fkey";

-- DropForeignKey
ALTER TABLE "CaseNote" DROP CONSTRAINT "CaseNote_authorId_fkey";

-- DropForeignKey
ALTER TABLE "CaseNote" DROP CONSTRAINT "CaseNote_caseId_fkey";

-- DropForeignKey
ALTER TABLE "CaseTimeline" DROP CONSTRAINT "CaseTimeline_caseId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_arbitratorId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_caseId_fkey";

-- DropForeignKey
ALTER TABLE "Hearing" DROP CONSTRAINT "Hearing_arbitratorId_fkey";

-- DropForeignKey
ALTER TABLE "Hearing" DROP CONSTRAINT "Hearing_caseId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_caseId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_senderId_fkey";

-- DropForeignKey
ALTER TABLE "QAReview" DROP CONSTRAINT "QAReview_caseId_fkey";

-- DropForeignKey
ALTER TABLE "QAReview" DROP CONSTRAINT "QAReview_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_caseId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_userId_fkey";

-- AlterTable
ALTER TABLE "Arbitration" DROP COLUMN "archiveReason",
DROP COLUMN "archivedAt",
DROP COLUMN "archivedBy",
DROP COLUMN "assignedManagerId",
DROP COLUMN "dueDate",
DROP COLUMN "estimatedCompletion",
DROP COLUMN "isArchived",
DROP COLUMN "priority",
DROP COLUMN "reviewNotes",
DROP COLUMN "reviewStatus",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "slaDeadline",
DROP COLUMN "workflowStatus",
ADD COLUMN     "arbitratorId" TEXT,
ADD COLUMN     "arbitratorSelectionStatus" TEXT DEFAULT 'not_started',
ADD COLUMN     "currentProposerRole" TEXT,
ALTER COLUMN "caseNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "CaseAssignment" DROP COLUMN "assignedAt",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "arbitratorStatus",
DROP COLUMN "documents",
DROP COLUMN "isActive",
DROP COLUMN "isSuspended",
DROP COLUMN "managedCases",
DROP COLUMN "mobile",
DROP COLUMN "paymentId",
DROP COLUMN "resetToken",
DROP COLUMN "suspendedUntil",
DROP COLUMN "suspensionReason",
DROP COLUMN "teamMembers",
DROP COLUMN "temporaryPassword",
ADD COLUMN     "blockoutDates" JSONB,
ADD COLUMN     "conflictOfInterest" JSONB,
ADD COLUMN     "documentUrls" JSONB,
ADD COLUMN     "hearingPreference" TEXT,
ADD COLUMN     "pastExperience" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "scoreMetrics" JSONB,
ALTER COLUMN "hourlyRate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "languages" DROP NOT NULL,
ALTER COLUMN "languages" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Announcement";

-- DropTable
DROP TABLE "ArbitratorAvailability";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Award";

-- DropTable
DROP TABLE "CaseNote";

-- DropTable
DROP TABLE "CaseTimeline";

-- DropTable
DROP TABLE "Feedback";

-- DropTable
DROP TABLE "Hearing";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "NotificationTemplate";

-- DropTable
DROP TABLE "QAReview";

-- DropTable
DROP TABLE "Reminder";

-- DropTable
DROP TABLE "SystemSettings";

-- DropTable
DROP TABLE "WorkflowRule";

-- DropEnum
DROP TYPE "CaseAssignmentStatus";

-- DropEnum
DROP TYPE "HearingStatus";

-- DropEnum
DROP TYPE "HearingType";

-- DropEnum
DROP TYPE "WorkflowStatus";

-- CreateTable
CREATE TABLE "ArbitratorFeedback" (
    "id" TEXT NOT NULL,
    "arbitratorId" TEXT NOT NULL,
    "caseId" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "submittedBy" TEXT,
    "submitterRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArbitratorFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArbitratorProposal" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "arbitratorId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "proposerRole" "ProposedBy" NOT NULL,
    "status" "ArbitratorProposalStatus" NOT NULL DEFAULT 'PENDING',
    "sequence" INTEGER NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "responseNotes" TEXT,
    "arbitratorAccepted" BOOLEAN,
    "arbitratorResponseAt" TIMESTAMP(3),
    "arbitratorNotes" TEXT,
    "disclosureDocuments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArbitratorProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespondentCase" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "respondentType" TEXT NOT NULL,
    "respondentName" TEXT NOT NULL,
    "respondentEmail" TEXT NOT NULL,
    "respondentPhone" TEXT,
    "respondentAddress" JSONB,
    "notificationStatus" "NotificationStatus" NOT NULL DEFAULT 'SENT',
    "responseStatus" "ResponseStatus" NOT NULL DEFAULT 'PENDING',
    "currentPhase" "CasePhase" NOT NULL DEFAULT 'NOTICE_SENT',
    "noticeServedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseDeadline" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "noticeAttempts" INTEGER NOT NULL DEFAULT 1,
    "lastNoticeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespondentCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNotification" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "emailId" TEXT,
    "smsId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseResponse" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "responseOverview" TEXT NOT NULL,
    "admitsClaimInFull" BOOLEAN NOT NULL DEFAULT false,
    "admitsClaimInPart" BOOLEAN NOT NULL DEFAULT false,
    "deniesClaimInFull" BOOLEAN NOT NULL DEFAULT false,
    "disputePointResponses" JSONB[],
    "counterClaims" JSONB[],
    "documents" JSONB[],
    "evidence" JSONB[],
    "witnessStatements" JSONB[],
    "legalArguments" TEXT,
    "lawsReliedUpon" JSONB[],
    "additionalNotes" TEXT,
    "requestedReliefs" JSONB[],
    "status" "ResponseStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespondentRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "caseId" TEXT,
    "invitationToken" TEXT,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "registeredAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespondentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RespondentCase_caseId_respondentId_key" ON "RespondentCase"("caseId", "respondentId");

-- CreateIndex
CREATE UNIQUE INDEX "RespondentRegistration_email_key" ON "RespondentRegistration"("email");

-- AddForeignKey
ALTER TABLE "ArbitratorFeedback" ADD CONSTRAINT "ArbitratorFeedback_arbitratorId_fkey" FOREIGN KEY ("arbitratorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArbitratorProposal" ADD CONSTRAINT "ArbitratorProposal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArbitratorProposal" ADD CONSTRAINT "ArbitratorProposal_arbitratorId_fkey" FOREIGN KEY ("arbitratorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArbitratorProposal" ADD CONSTRAINT "ArbitratorProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentCase" ADD CONSTRAINT "RespondentCase_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentCase" ADD CONSTRAINT "RespondentCase_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNotification" ADD CONSTRAINT "CaseNotification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNotification" ADD CONSTRAINT "CaseNotification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNotification" ADD CONSTRAINT "CaseNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseResponse" ADD CONSTRAINT "CaseResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseResponse" ADD CONSTRAINT "CaseResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
