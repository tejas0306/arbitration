-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CasePhase" AS ENUM ('NOTICE_SENT', 'RESPONSE_PENDING', 'RESPONSE_SUBMITTED', 'ARBITRATOR_SELECTION', 'EVIDENCE_PHASE', 'HEARING_PHASE', 'AWARD_PHASE', 'COMPLETED', 'APPEALED');

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
    "notificationStatus" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
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
ALTER TABLE "RespondentCase" ADD CONSTRAINT "RespondentCase_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentCase" ADD CONSTRAINT "RespondentCase_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseResponse" ADD CONSTRAINT "CaseResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Arbitration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseResponse" ADD CONSTRAINT "CaseResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
