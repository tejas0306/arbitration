import { Controller, Get, Param, Query, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Controller('api/cases/public')
export class CasesPublicController {
  constructor(private prisma: PrismaService) {}

  @Get(':caseNumber')
  async getPublicCase(
    @Param('caseNumber') caseNumber: string,
    @Query('code') accessCode: string,
  ) {
    if (!accessCode) {
      throw new UnauthorizedException('Access code required');
    }

    try {
      // Find the case by case number
      const caseData = await this.prisma.arbitration.findFirst({
        where: { caseNumber },
        include: {
          user: true, // Claimant
          respondentCases: {
            include: {
              respondent: true
            }
          },
          caseResponses: true
        }
      });

      if (!caseData) {
        throw new NotFoundException('Case not found');
      }

      // For now, we'll accept any non-empty access code
      // In production, implement proper access code validation
      if (!accessCode || accessCode.length < 4) {
        throw new UnauthorizedException('Invalid access code');
      }

      // Find the respondent case that matches this access request
      const respondentCase = caseData.respondentCases[0]; // For simplicity, take first respondent
      
      if (!respondentCase) {
        throw new NotFoundException('Respondent case not found');
      }

      // Check if respondent has already responded
      const hasResponded = caseData.caseResponses.some(
        response => response.respondentId === respondentCase.respondentId
      );

      // Calculate response deadline (21 days from case creation if not set)
      const responseDeadline = respondentCase.responseDeadline || 
        new Date(caseData.createdAt.getTime() + 21 * 24 * 60 * 60 * 1000);

      // Prepare petition data (all the form data from claimant)
      const petitionData = {
        // Basic info from schema
        name: caseData.name,
        type: caseData.type,
        address1: caseData.address1,
        address2: caseData.address2,
        state: caseData.state,
        country: caseData.country,
        email: caseData.email,
        phone: caseData.phone,
        additionalClaimants: caseData.additionalClaimants,
        respondents: caseData.respondents,
        arbitrationAgreement: caseData.arbitrationAgreement,
        disputeDetails: caseData.disputeDetails,
        documents: caseData.documents,
        arguments: caseData.arguments,
        payment: caseData.payment,
        prayers: caseData.prayers,
        managerDetails: caseData.managerDetails,
        formData: caseData.formData,
      };

      const response = {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        claimantName: caseData.user.name,
        submissionDate: caseData.createdAt,
        responseDeadline,
        status: caseData.status,
        petitionData,
        respondentName: respondentCase.respondentName,
        respondentEmail: respondentCase.respondentEmail,
        hasResponded,
      };

      return response;

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve case data');
    }
  }
}
