import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

export interface WorkflowRound {
  caseId: string;
  roundNumber: number;
  roundType: 'CLAIMANT_SUBMISSION' | 'RESPONDENT_REVIEW' | 'CLAIMANT_COUNTER' | 'FINAL_SUBMISSION' | 'AI_JUDGMENT';
  assignedTo: string;
  assignedRole: 'CLAIMANT' | 'RESPONDENT' | 'ARBITRATOR' | 'ADMIN';
  deadline: Date;
}

export interface FieldResponse {
  fieldId: string;
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CORRECTED';
  respondentComment?: string;
  correctedValue?: string;
  evidence?: any;
}

export interface AIJudgment {
  issueId: string;
  issueDescription: string;
  claimantPosition: string;
  respondentPosition: string;
  aiAnalysis: string;
  aiRecommendation: string;
  confidence: number;
}

@Injectable()
export class WorkflowEnhancedService {
  private readonly logger = new Logger(WorkflowEnhancedService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize workflow for a new case
   */
  async initializeWorkflow(caseId: string, claimantId: string, respondentIds: string[]) {
    this.logger.log(`Initializing workflow for case ${caseId}`);

    // Create Round 1: Claimant Submission
    await this.createWorkflowRound({
      caseId,
      roundNumber: 1,
      roundType: 'CLAIMANT_SUBMISSION',
      assignedTo: claimantId,
      assignedRole: 'CLAIMANT',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Create Round 2: Respondent Review
    for (const respondentId of respondentIds) {
      await this.createWorkflowRound({
        caseId,
        roundNumber: 2,
        roundType: 'RESPONDENT_REVIEW',
        assignedTo: respondentId,
        assignedRole: 'RESPONDENT',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days
      });
    }

    // Update case status
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: {
        workflowStatus: 'IN_PROGRESS',
        updatedAt: new Date()
      }
    });

    this.logger.log(`Workflow initialized for case ${caseId}`);
  }

  /**
   * Create a workflow round
   */
  private async createWorkflowRound(roundData: WorkflowRound) {
    return await this.prisma.workflowRound.create({
      data: {
        caseId: roundData.caseId,
        roundNumber: roundData.roundNumber,
        roundType: roundData.roundType,
        status: 'PENDING',
        assignedTo: roundData.assignedTo,
        assignedRole: roundData.assignedRole,
        deadline: roundData.deadline,
        startedAt: new Date()
      }
    });
  }

  /**
   * Process respondent response and move to next round
   */
  async processRespondentResponse(caseId: string, respondentId: string, fieldResponses: FieldResponse[]) {
    this.logger.log(`Processing respondent response for case ${caseId}`);

    // Update field responses in database
    for (const fieldResponse of fieldResponses) {
      await this.prisma.fieldResponse.upsert({
        where: {
          caseId_respondentId_fieldId_round: {
            caseId,
            respondentId,
            fieldId: fieldResponse.fieldId,
            round: 2
          }
        },
        update: {
          status: fieldResponse.status,
          respondentComment: fieldResponse.respondentComment,
          correctedValue: fieldResponse.correctedValue,
          evidence: fieldResponse.evidence || {},
          updatedAt: new Date()
        },
        create: {
          caseResponseId: '', // Will be updated
          caseId,
          respondentId,
          fieldId: fieldResponse.fieldId,
          fieldName: fieldResponse.fieldName,
          fieldValue: fieldResponse.fieldValue,
          fieldType: fieldResponse.fieldType,
          status: fieldResponse.status,
          respondentComment: fieldResponse.respondentComment,
          correctedValue: fieldResponse.correctedValue,
          evidence: fieldResponse.evidence || {},
          round: 2
        }
      });
    }

    // Check if all respondents have responded
    const allRespondentsResponded = await this.checkAllRespondentsResponded(caseId);
    
    if (allRespondentsResponded) {
      // Move to Round 3: Claimant Counter-Response
      await this.moveToNextRound(caseId, 3, 'CLAIMANT_COUNTER');
    }

    this.logger.log(`Respondent response processed for case ${caseId}`);
  }

  /**
   * Process claimant counter-response and move to final round
   */
  async processClaimantCounterResponse(caseId: string, claimantId: string, counterResponses: any[]) {
    this.logger.log(`Processing claimant counter-response for case ${caseId}`);

    // Create Round 3: Claimant Counter-Response
    await this.createWorkflowRound({
      caseId,
      roundNumber: 3,
      roundType: 'CLAIMANT_COUNTER',
      assignedTo: claimantId,
      assignedRole: 'CLAIMANT',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    });

    // Move to Round 4: Final Submission
    await this.moveToNextRound(caseId, 4, 'FINAL_SUBMISSION');

    this.logger.log(`Claimant counter-response processed for case ${caseId}`);
  }

  /**
   * Process final submission and generate AI judgment
   */
  async processFinalSubmission(caseId: string) {
    this.logger.log(`Processing final submission for case ${caseId}`);

    // Generate AI judgment for each disputed field
    const disputedFields = await this.getDisputedFields(caseId);
    
    for (const field of disputedFields) {
      const judgment = await this.generateAIJudgment(field);
      await this.saveAIJudgment(caseId, judgment);
    }

    // Move to AI Judgment round
    await this.moveToNextRound(caseId, 5, 'AI_JUDGMENT');

    // Update case status to completed
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: {
        workflowStatus: 'COMPLETED',
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    this.logger.log(`Final submission processed for case ${caseId}`);
  }

  /**
   * Check if all respondents have responded
   */
  private async checkAllRespondentsResponded(caseId: string): Promise<boolean> {
    const respondentCases = await this.prisma.respondentCase.findMany({
      where: { caseId }
    });

    return respondentCases.every(rc => rc.responseStatus === 'SUBMITTED');
  }

  /**
   * Move to next round
   */
  private async moveToNextRound(caseId: string, roundNumber: number, roundType: string) {
    // Complete current round
    await this.prisma.workflowRound.updateMany({
      where: { 
        caseId,
        roundNumber: roundNumber - 1
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create next round
    const nextRound = await this.prisma.workflowRound.create({
      data: {
        caseId,
        roundNumber,
        roundType: roundType as any,
        status: 'PENDING',
        assignedTo: '', // Will be assigned based on round type
        assignedRole: 'CLAIMANT', // Default, will be updated
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        startedAt: new Date()
      }
    });

    this.logger.log(`Moved to round ${roundNumber} for case ${caseId}`);
    return nextRound;
  }

  /**
   * Get disputed fields for AI judgment
   */
  private async getDisputedFields(caseId: string): Promise<any[]> {
    const fieldResponses = await this.prisma.fieldResponse.findMany({
      where: {
        caseId,
        status: 'REJECTED'
      },
      orderBy: {
        fieldId: 'asc'
      }
    });

    return fieldResponses;
  }

  /**
   * Generate AI judgment for a disputed field
   */
  private async generateAIJudgment(field: any): Promise<AIJudgment> {
    // This is a placeholder for AI integration
    // In production, this would call OpenAI or similar AI service
    
    const issueId = field.fieldId;
    const issueDescription = field.fieldName;
    const claimantPosition = field.fieldValue;
    const respondentPosition = field.correctedValue || 'Disputed';

    // Simple rule-based analysis (replace with AI)
    let aiAnalysis = '';
    let aiRecommendation = '';
    let confidence = 0.5;

    if (field.evidence && Object.keys(field.evidence).length > 0) {
      aiAnalysis = 'Evidence provided supports the position.';
      aiRecommendation = 'Consider the evidence in making decision.';
      confidence = 0.7;
    } else if (field.respondentComment && field.respondentComment.length > 10) {
      aiAnalysis = 'Detailed comment provided by respondent.';
      aiRecommendation = 'Review comment carefully before decision.';
      confidence = 0.6;
    } else {
      aiAnalysis = 'Limited information available for analysis.';
      aiRecommendation = 'Request additional information if possible.';
      confidence = 0.4;
    }

    return {
      issueId,
      issueDescription,
      claimantPosition,
      respondentPosition,
      aiAnalysis,
      aiRecommendation,
      confidence
    };
  }

  /**
   * Save AI judgment to database
   */
  private async saveAIJudgment(caseId: string, judgment: AIJudgment) {
    return await this.prisma.aIJudgment.create({
      data: {
        caseId,
        round: 5,
        issueId: judgment.issueId,
        issueDescription: judgment.issueDescription,
        claimantPosition: judgment.claimantPosition,
        respondentPosition: judgment.respondentPosition,
        aiAnalysis: judgment.aiAnalysis,
        aiRecommendation: judgment.aiRecommendation,
        confidence: judgment.confidence
      }
    });
  }

  /**
   * Get workflow status for a case
   */
  async getWorkflowStatus(caseId: string) {
    const rounds = await this.prisma.workflowRound.findMany({
      where: { caseId },
      orderBy: { roundNumber: 'asc' }
    });

    const currentRound = rounds.find(r => r.status === 'IN_PROGRESS') || rounds[rounds.length - 1];

    return {
      caseId,
      currentRound: currentRound?.roundNumber || 1,
      currentRoundType: currentRound?.roundType || 'CLAIMANT_SUBMISSION',
      totalRounds: rounds.length,
      rounds: rounds.map(r => ({
        roundNumber: r.roundNumber,
        type: r.roundType,
        status: r.status,
        assignedTo: r.assignedTo,
        assignedRole: r.assignedRole,
        deadline: r.deadline,
        startedAt: r.startedAt,
        completedAt: r.completedAt
      }))
    };
  }

  /**
   * Get field responses for a specific round
   */
  async getFieldResponses(caseId: string, round: number) {
    return await this.prisma.fieldResponse.findMany({
      where: {
        caseId,
        round
      },
      orderBy: {
        fieldId: 'asc'
      }
    });
  }

  /**
   * Get AI judgments for a case
   */
  async getAIJudgments(caseId: string) {
    return await this.prisma.aIJudgment.findMany({
      where: { caseId },
      orderBy: { issueId: 'asc' }
    });
  }

  /**
   * Generate final order document
   */
  async generateFinalOrder(caseId: string) {
    const caseData = await this.prisma.arbitration.findUnique({
      where: { id: caseId },
      include: {
        // Note: fieldResponses and aiJudgments are separate models
        // They will be fetched separately
      }
    });

    if (!caseData) {
      throw new Error('Case not found');
    }

    // Generate order content based on field responses and AI judgments
    const orderContent = this.formatOrderContent(caseData);
    
    return {
      caseId,
      caseNumber: caseData.caseNumber,
      orderContent,
      generatedAt: new Date()
    };
  }

  /**
   * Format order content
   */
  private formatOrderContent(caseData: any): string {
    let content = `ARBITRATION ORDER\n`;
    content += `Case Number: ${caseData.caseNumber}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n\n`;

    content += `SUMMARY OF DECISIONS:\n\n`;

    // Add field-level decisions
    if (caseData.fieldResponses) {
      caseData.fieldResponses.forEach((field: any) => {
        content += `${field.fieldId}. ${field.fieldName}:\n`;
        content += `   Original: ${field.fieldValue}\n`;
        content += `   Status: ${field.status}\n`;
        if (field.respondentComment) {
          content += `   Comment: ${field.respondentComment}\n`;
        }
        if (field.correctedValue) {
          content += `   Corrected: ${field.correctedValue}\n`;
        }
        content += `\n`;
      });
    }

    // Add AI judgments
    if (caseData.aiJudgments) {
      content += `AI ANALYSIS:\n\n`;
      caseData.aiJudgments.forEach((judgment: any) => {
        content += `Issue ${judgment.issueId}: ${judgment.issueDescription}\n`;
        content += `AI Analysis: ${judgment.aiAnalysis}\n`;
        content += `Recommendation: ${judgment.aiRecommendation}\n`;
        content += `Confidence: ${(judgment.confidence * 100).toFixed(1)}%\n\n`;
      });
    }

    content += `\nORDER:\n`;
    content += `Based on the above analysis, the following order is issued:\n\n`;

    // Generate order based on field statuses
    if (caseData.fieldResponses) {
      caseData.fieldResponses.forEach((field: any) => {
        if (field.status === 'REJECTED') {
          content += `- Field ${field.fieldId} (${field.fieldName}) is REJECTED. `;
          content += `The corrected value "${field.correctedValue}" is accepted.\n`;
        } else if (field.status === 'ACCEPTED') {
          content += `- Field ${field.fieldId} (${field.fieldName}) is ACCEPTED as provided.\n`;
        }
      });
    }

    content += `\nThis order is final and binding on all parties.\n`;
    content += `Generated by Arbitration Portal AI System\n`;

    return content;
  }
}
