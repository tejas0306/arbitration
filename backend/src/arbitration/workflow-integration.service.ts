import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class ArbitrationWorkflowService {
  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowService,
  ) {}

  async submitArbitrationCase(caseData: any, userId: string) {
    try {
      // Create the arbitration case using the existing service
      const result = await this.prisma.arbitration.create({
        data: {
          ...caseData,
          userId,
          status: 'PETITION_SUBMITTED',
          isDraft: false
        }
      });

      // Trigger workflow for petition submission
      await this.workflowService.triggerWorkflow(result.id, 'petition_submitted');

      return result;
    } catch (error) {
      console.error('Error submitting arbitration case:', error);
      throw error;
    }
  }

  async getCounterResponseData(caseId: string, userId: string) {
    try {
      const caseData = await this.prisma.arbitration.findFirst({
        where: {
          id: caseId,
          userId: userId // Ensure user owns this case
        },
        include: {
          caseResponses: {
            include: {
              respondent: true
            }
          }
        }
      });

      if (!caseData) {
        throw new Error('Case not found or access denied');
      }

      // Check if case is in the right state for counter-response
      if (caseData.status !== 'AWAITING_COUNTER_RESPONSE' && caseData.status !== 'RESPONDENT_RESPONDED') {
        throw new Error('Case is not ready for counter-response');
      }

      // Get the latest response
      const latestResponse = caseData.caseResponses.find(r => r.round === 1);
      if (!latestResponse) {
        throw new Error('No respondent response found');
      }

      // Check if counter-response already exists
      const hasCounterResponse = await this.prisma.caseResponse.findFirst({
        where: {
          caseId,
          round: 2 // Counter-response is round 2
        }
      });

      const counterResponseDeadline = new Date();
      counterResponseDeadline.setDate(counterResponseDeadline.getDate() + 14);

      return {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        status: caseData.status,
        originalData: {
          // Map schema fields to expected format
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
        },
        respondentResponses: latestResponse.disputePointResponses || [],
        respondentIssues: latestResponse.counterClaims || [],
        hasCounterResponse: !!hasCounterResponse,
        counterResponseDeadline: counterResponseDeadline.toISOString()
      };

    } catch (error) {
      console.error('Error getting counter-response data:', error);
      throw error;
    }
  }

  async submitCounterResponse(caseId: string, counterResponses: any[], issueResponses: any[], userId: string) {
    try {
      // Verify case ownership
      const caseData = await this.prisma.arbitration.findFirst({
        where: {
          id: caseId,
          userId: userId
        }
      });

      if (!caseData) {
        throw new Error('Case not found or access denied');
      }

      // Create counter-response record
      await this.prisma.caseResponse.create({
        data: {
          caseId,
          respondentId: userId, // Claimant submitting counter-response
          status: 'SUBMITTED',
          submittedAt: new Date(),
          round: 2, // Counter-response is round 2
          additionalNotes: `Claimant submitted counter-response with ${counterResponses.length} field responses and ${issueResponses.length} issue responses.`,
          disputePointResponses: counterResponses,
          counterClaims: issueResponses,
          documents: [],
          evidence: [],
          witnessStatements: [],
        }
      });

      // Trigger workflow for counter-response submission
      await this.workflowService.triggerWorkflow(caseId, 'counter_response_submitted');

      return {
        success: true,
        message: 'Counter-response submitted successfully',
        nextStep: 'READY_FOR_ARBITRATION'
      };

    } catch (error) {
      console.error('Error submitting counter-response:', error);
      throw error;
    }
  }

  async getCaseSummary(caseId: string, userId: string) {
    try {
      const caseData = await this.prisma.arbitration.findFirst({
        where: {
          id: caseId,
          OR: [
            { userId: userId }, // Claimant
            { respondentCases: { some: { respondentId: userId } } } // Respondent
          ]
        },
        include: {
          user: true,
          respondentCases: {
            include: { respondent: true }
          },
          caseResponses: {
            include: { respondent: true },
            orderBy: { round: 'asc' }
          }
        }
      });

      if (!caseData) {
        throw new Error('Case not found or access denied');
      }

      // Build form steps data for tabular view
      const formSteps = this.buildFormStepsForSummary(caseData);

      return {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        petitionerName: caseData.user.name,
        respondentName: caseData.respondentCases[0]?.respondentName || 'Unknown',
        caseStatus: caseData.status,
        formSteps,
        respondentIssues: this.extractRespondentIssues(caseData.caseResponses),
        timeline: this.buildCaseTimeline(caseData)
      };

    } catch (error) {
      console.error('Error getting case summary:', error);
      throw error;
    }
  }

  private buildFormStepsForSummary(caseData: any) {
    const steps: any[] = [];
    
    // Map the original form data to steps using actual schema fields
    const originalData = {
      name: caseData.name,
      type: caseData.type,
      address: caseData.address,
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

    // Get respondent responses
    const respondentResponse = caseData.caseResponses.find(r => r.round === 1);
    const counterResponse = caseData.caseResponses.find(r => r.round === 2);

    // Build simplified steps for now
    for (let stepNumber = 1; stepNumber <= 10; stepNumber++) {
      const step = {
        stepNumber,
        stepTitle: this.getStepTitle(stepNumber),
        fields: this.buildFieldsForStep(stepNumber, originalData, respondentResponse, counterResponse)
      };
      steps.push(step);
    }

    return steps;
  }

  private getStepTitle(stepNumber: number): string {
    const titles = {
      1: 'Claimant Details',
      2: 'Additional Claimants & Manager',
      3: 'Respondent Details',
      4: 'Arbitration Agreement',
      5: 'Nature of Dispute',
      6: 'Dispute Description',
      7: 'Prayers & Reliefs',
      8: 'Documents & Evidence',
      9: 'Payment Details',
      10: 'Legal Arguments'
    };
    return titles[stepNumber] || `Step ${stepNumber}`;
  }

  private buildFieldsForStep(stepNumber: number, originalData: any, respondentResponse: any, counterResponse: any) {
    const fields: any[] = [];
    
    switch (stepNumber) {
      case 1: // Claimant Details
        if (originalData.name) {
          fields.push({
            id: 'claimant.name',
            label: 'Claimant Name',
            petitionerValue: originalData.name,
            respondentResponse: this.getFieldResponse(respondentResponse, 'claimant.name'),
            petitionerCounterResponse: this.getFieldCounterResponse(counterResponse, 'claimant.name')
          });
        }
        if (originalData.email) {
          fields.push({
            id: 'claimant.email',
            label: 'Email',
            petitionerValue: originalData.email,
            respondentResponse: this.getFieldResponse(respondentResponse, 'claimant.email'),
            petitionerCounterResponse: this.getFieldCounterResponse(counterResponse, 'claimant.email')
          });
        }
        break;
      case 9: // Payment
        if (originalData.payment) {
          fields.push({
            id: 'payment.amount',
            label: 'Claim Amount',
            petitionerValue: originalData.payment,
            respondentResponse: this.getFieldResponse(respondentResponse, 'payment.amount'),
            petitionerCounterResponse: this.getFieldCounterResponse(counterResponse, 'payment.amount')
          });
        }
        break;
      // Add more cases for other steps as needed...
    }

    return fields;
  }

  private getFieldResponse(respondentResponse: any, fieldId: string) {
    if (!respondentResponse?.disputePointResponses) return null;
    
    return respondentResponse.disputePointResponses.find(r => r.fieldId === fieldId);
  }

  private getFieldCounterResponse(counterResponse: any, fieldId: string) {
    if (!counterResponse?.disputePointResponses) return null;
    
    return counterResponse.disputePointResponses.find(r => r.fieldId === fieldId);
  }

  private extractRespondentIssues(responses: any[]) {
    const respondentResponse = responses.find(r => r.round === 1);
    if (!respondentResponse?.counterClaims) return [];
    
    return respondentResponse.counterClaims.map(issue => ({
      ...issue,
      petitionerResponse: this.getIssueCounterResponse(responses, issue.id)
    }));
  }

  private getIssueCounterResponse(responses: any[], issueId: string) {
    const counterResponse = responses.find(r => r.round === 2);
    if (!counterResponse?.counterClaims) return null;
    
    return counterResponse.counterClaims.find(r => r.issueId === issueId);
  }

  private buildCaseTimeline(caseData: any) {
    const timeline: any[] = [];
    
    timeline.push({
      event: 'Petition Submitted',
      date: caseData.createdAt,
      actor: caseData.user.name,
      description: 'Initial arbitration petition submitted'
    });

    caseData.caseResponses.forEach(response => {
      if (response.round === 1) {
        timeline.push({
          event: 'Respondent Response',
          date: response.submittedAt,
          actor: response.respondent.name,
          description: 'Respondent submitted response to petition'
        });
      } else if (response.round === 2) {
        timeline.push({
          event: 'Counter-Response',
          date: response.submittedAt,
          actor: caseData.user.name,
          description: 'Claimant submitted counter-response'
        });
      }
    });

    return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
