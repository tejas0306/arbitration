import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../services/email.service';

@Injectable()
export class RespondentNotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Send case notice to respondent
  async sendCaseNotice(caseId: string, respondentEmail: string, respondentName: string) {
    try {
      // Get case details
      const caseData = await this.prisma.arbitration.findUnique({
        where: { id: caseId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              organization: true,
            }
          }
        }
      });

      if (!caseData) {
        throw new Error('Case not found');
      }

      // Check if respondent user exists
      let respondentUser = await this.prisma.user.findUnique({
        where: { email: respondentEmail }
      });

      // If respondent doesn't exist, create a registration record
      if (!respondentUser) {
        const registration = await this.prisma.respondentRegistration.create({
          data: {
            email: respondentEmail,
            name: respondentName,
            caseId: caseId,
            invitationToken: this.generateInvitationToken(),
            verificationToken: this.generateVerificationToken(),
          }
        });

        // Send registration invitation email
        await this.emailService.sendRespondentInvitation(
          respondentEmail,
          respondentName,
          caseData,
          registration.invitationToken || ''
        );
      } else {
        // Create or update respondent case record
        await this.prisma.respondentCase.upsert({
          where: {
            caseId_respondentId: {
              caseId: caseId,
              respondentId: respondentUser.id,
            }
          },
          update: {
            noticeAttempts: {
              increment: 1
            },
            lastNoticeAt: new Date(),
          },
          create: {
            caseId: caseId,
            respondentId: respondentUser.id,
            respondentType: 'Individual', // Default, can be updated
            respondentName: respondentUser.name,
            respondentEmail: respondentUser.email,
            respondentPhone: respondentUser.mobile,
            responseDeadline: this.calculateResponseDeadline(),
          }
        });

        // Create notification record
        const notification = await this.prisma.notification.create({
          data: {
            title: `New Arbitration Case: ${caseData.name}`,
            message: `You have been named as a respondent in an arbitration case filed by ${caseData.user.name}. Please review the case details and submit your response.`,
            type: 'SYSTEM',
            senderId: caseData.userId,
            recipientId: respondentUser.id,
            caseId: caseId,
            metadata: {
              caseNumber: caseData.caseNumber,
              claimantName: caseData.user.name,
              responseDeadline: this.calculateResponseDeadline(),
            }
          }
        });

        // Send email notification
        await this.emailService.sendCaseNotification(
          respondentUser.email,
          respondentUser.name,
          caseData,
          notification
        );
      }

      return { success: true, message: 'Case notice sent successfully' };
    } catch (error) {
      console.error('Error sending case notice:', error);
      throw error;
    }
  }

  // Send arbitrator proposal notification
  async sendArbitratorProposalNotification(proposalId: string, respondentId: string) {
    try {
      // TODO: Implement when ArbitratorProposal model is available in backend
      console.log('Arbitrator proposal notification not implemented yet');
      return { success: false, message: 'ArbitratorProposal model not available' };
      
      /*
      const proposal = await this.prisma.arbitratorProposal.findUnique({
        where: { id: proposalId },
        include: {
          case: true,
          arbitrator: {
            select: {
              name: true,
              email: true,
              expertise: true,
              experience: true,
            }
          },
          proposedBy: {
            select: {
              name: true,
              role: true,
            }
          }
        }
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const respondent = await this.prisma.user.findUnique({
        where: { id: respondentId }
      });

      if (!respondent) {
        throw new Error('Respondent not found');
      }

      // Create notification
      const notification = await this.prisma.notification.create({
        data: {
          title: `Arbitrator Proposed for Case ${proposal.case.caseNumber}`,
          message: `${proposal.proposedBy.name} has proposed ${proposal.arbitrator.name} as arbitrator for case ${proposal.case.name}. Please review and respond.`,
          type: 'SYSTEM',
          senderId: proposal.proposedById,
          recipientId: respondentId,
          caseId: proposal.caseId,
          metadata: {
            proposalId: proposalId,
            arbitratorName: proposal.arbitrator.name,
            arbitratorExpertise: proposal.arbitrator.expertise,
          }
        }
      });

      // Send email notification
      await this.emailService.sendArbitratorProposalNotification(
        respondent.email,
        respondent.name,
        proposal,
        notification
      );

      return { success: true, message: 'Arbitrator proposal notification sent' };
      */
    } catch (error) {
      console.error('Error sending arbitrator proposal notification:', error);
      throw error;
    }
  }

  // Send hearing schedule notification
  async sendHearingNotification(hearingId: string, respondentId: string) {
    try {
      const hearing = await this.prisma.hearing.findUnique({
        where: { id: hearingId },
        include: {
          case: true,
          arbitrator: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });

      if (!hearing) {
        throw new Error('Hearing not found');
      }

      const respondent = await this.prisma.user.findUnique({
        where: { id: respondentId }
      });

      if (!respondent) {
        throw new Error('Respondent not found');
      }

      // Create notification
      const notification = await this.prisma.notification.create({
        data: {
          title: `Hearing Scheduled for Case ${hearing.case.caseNumber}`,
          message: `A hearing has been scheduled for ${hearing.scheduledDate.toLocaleDateString()} at ${hearing.scheduledDate.toLocaleTimeString()}. Please mark your calendar.`,
          type: 'SYSTEM',
          senderId: hearing.arbitratorId,
          recipientId: respondentId,
          caseId: hearing.caseId,
          metadata: {
            hearingId: hearingId,
            hearingDate: hearing.scheduledDate,
            hearingType: hearing.type,
            arbitratorName: hearing.arbitrator.name,
          }
        }
      });

      // Send email notification
      await this.emailService.sendHearingNotification(
        respondent.email,
        respondent.name,
        hearing,
        notification
      );

      return { success: true, message: 'Hearing notification sent' };
    } catch (error) {
      console.error('Error sending hearing notification:', error);
      throw error;
    }
  }

  // Helper methods
  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private calculateResponseDeadline(): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30); // 30 days from now
    return deadline;
  }
} 