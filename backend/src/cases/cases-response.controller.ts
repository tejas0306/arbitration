import { Controller, Post, Param, Body, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { NotificationService } from '../services/notification.service';

interface ResponseField {
  fieldId: string;
  action: 'accept' | 'reject' | 'modify';
  respondentValue?: any;
  comment?: string;
  attachments?: any[];
}

interface NewIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  attachments: any[];
  legalBasis?: string;
  requestedRelief?: string;
}

interface SubmitResponseDto {
  responses: ResponseField[];
  newIssues: NewIssue[];
  accessCode: string;
}

@Controller('api/cases')
export class CasesResponseController {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  @Post(':caseId/respond')
  async submitRespondentResponse(
    @Param('caseId') caseId: string,
    @Body() submitResponseDto: SubmitResponseDto,
  ) {
    const { responses, newIssues, accessCode } = submitResponseDto;

    if (!accessCode) {
      throw new UnauthorizedException('Access code required');
    }

    try {
      // Verify the case exists and get respondent info
      const caseData = await this.prisma.arbitration.findUnique({
        where: { id: caseId },
        include: {
          respondentCases: {
            include: {
              respondent: true
            }
          }
        }
      });

      if (!caseData) {
        throw new BadRequestException('Case not found');
      }

      // For now, accept any valid access code (implement proper validation in production)
      if (!accessCode || accessCode.length < 4) {
        throw new UnauthorizedException('Invalid access code');
      }

      const respondentCase = caseData.respondentCases[0]; // Taking first respondent for simplicity
      
      if (!respondentCase) {
        throw new BadRequestException('Respondent case not found');
      }

      // Check if response already exists
      const existingResponse = await this.prisma.caseResponse.findFirst({
        where: {
          caseId,
          respondentId: respondentCase.respondentId
        }
      });

      if (existingResponse) {
        // Update existing response
        await this.prisma.caseResponse.update({
          where: { id: existingResponse.id },
          data: {
            status: 'SUBMITTED',
            submittedAt: new Date(),
            round: 1, // First round response
            // Store responses in existing JSON fields
            disputePointResponses: responses.map(r => ({
              fieldId: r.fieldId,
              action: r.action,
              respondentValue: r.respondentValue,
              comment: r.comment
            })),
            counterClaims: newIssues.map(issue => ({
              id: issue.id,
              title: issue.title,
              description: issue.description,
              category: issue.category,
              legalBasis: issue.legalBasis,
              requestedRelief: issue.requestedRelief
            })),
            additionalNotes: `Respondent submitted ${responses.length} field responses and ${newIssues.length} new issues.`
          }
        });
      } else {
        // Create new response
        await this.prisma.caseResponse.create({
          data: {
            caseId,
            respondentId: respondentCase.respondentId,
            status: 'SUBMITTED',
            submittedAt: new Date(),
            round: 1, // First round response
            // Store responses in JSON fields from schema
            disputePointResponses: responses.map(r => ({
              fieldId: r.fieldId,
              action: r.action,
              respondentValue: r.respondentValue,
              comment: r.comment
            })),
            counterClaims: newIssues.map(issue => ({
              id: issue.id,
              title: issue.title,
              description: issue.description,
              category: issue.category,
              legalBasis: issue.legalBasis,
              requestedRelief: issue.requestedRelief
            })),
            documents: [], // Will be populated when file upload is implemented
            evidence: [],
            witnessStatements: [],
            additionalNotes: `Respondent submitted ${responses.length} field responses and ${newIssues.length} new issues.`
          }
        });
      }

      // Update respondent case status
      await this.prisma.respondentCase.update({
        where: { id: respondentCase.id },
        data: {
          responseStatus: 'SUBMITTED',
          respondedAt: new Date(),
          currentPhase: 'RESPONSE_SUBMITTED'
        }
      });

      // Update main case status
      await this.prisma.arbitration.update({
        where: { id: caseId },
        data: {
          status: 'RESPONDENT_RESPONDED'
        }
      });

      // Send notifications (Part 3e)
      try {
        await this.notificationService.sendRespondentSubmissionNotifications(caseId, respondentCase.respondentId);
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the response submission if notifications fail
      }

      return {
        success: true,
        message: 'Response submitted successfully',
        responseId: existingResponse?.id || 'new-response',
        nextStep: 'AWAITING_COUNTER_RESPONSE'
      };

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to submit response');
    }
  }
}
