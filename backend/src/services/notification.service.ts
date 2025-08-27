import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';
import { emailTemplates, generateEmailContent } from '../templates/email-templates';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Part 2h: Send notifications after petitioner submission
  async sendPetitionSubmissionNotifications(caseId: string) {
    try {
      const caseData = await this.prisma.arbitration.findUnique({
        where: { id: caseId },
        include: {
          user: true, // Claimant
          respondentCases: {
            include: {
              respondent: true
            }
          }
        }
      });

      if (!caseData) {
        throw new Error(`Case not found: ${caseId}`);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const caseNumber = caseData.caseNumber || caseId.slice(-8);
      
      // Generate respondent access code and URL
      const accessCode = this.generateAccessCode();
      const encryptedCaseNumber = this.encryptCaseNumber(caseNumber);
      const respondentUrl = `${frontendUrl}/case/${encryptedCaseNumber}?code=${accessCode}`;

      // Email to Claimant
      const claimantEmailData = {
        claimantName: caseData.user.name,
        caseNumber,
        submissionDate: caseData.createdAt.toLocaleDateString(),
        frontendUrl
      };

      await this.emailService.sendEmail({
        to: caseData.user.email,
        subject: generateEmailContent(emailTemplates.petitionerSubmission.subject, { caseNumber }),
        html: generateEmailContent(emailTemplates.petitionerSubmission.toClaimant, claimantEmailData)
      });

      // Email to each Respondent
      for (const respondentCase of caseData.respondentCases) {
        const responseDeadline = new Date();
        responseDeadline.setDate(responseDeadline.getDate() + 21); // 21 days to respond

        const respondentEmailData = {
          respondentName: respondentCase.respondentName,
          claimantName: caseData.user.name,
          caseNumber,
          submissionDate: caseData.createdAt.toLocaleDateString(),
          responseDeadline: responseDeadline.toLocaleDateString(),
          respondentUrl,
          accessCode
        };

        await this.emailService.sendEmail({
          to: respondentCase.respondentEmail,
          subject: generateEmailContent(emailTemplates.petitionerSubmission.subject, { caseNumber }),
          html: generateEmailContent(emailTemplates.petitionerSubmission.toRespondent, respondentEmailData)
        });

        // Update respondent case with access code and deadline
        await this.prisma.respondentCase.update({
          where: { id: respondentCase.id },
          data: {
            responseDeadline,
            lastNoticeAt: new Date()
          }
        });
      }

      // Email to Admin
      const adminEmailData = {
        caseNumber,
        claimantName: caseData.user.name,
        respondentName: caseData.respondentCases.map(rc => rc.respondentName).join(', '),
        disputeValue: this.extractDisputeValue(caseData),
        submissionDate: caseData.createdAt.toLocaleDateString(),
        adminUrl: `${frontendUrl}/admin`,
        caseId
      };

      // Get admin users
      const adminUsers = await this.prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      for (const admin of adminUsers) {
        await this.emailService.sendEmail({
          to: admin.email,
          subject: generateEmailContent(emailTemplates.petitionerSubmission.subject, { caseNumber }),
          html: generateEmailContent(emailTemplates.petitionerSubmission.toAdmin, adminEmailData)
        });
      }

      console.log(`Petition submission notifications sent for case ${caseNumber}`);
      return { success: true, message: 'Notifications sent successfully' };

    } catch (error) {
      console.error('Error sending petition submission notifications:', error);
      throw error;
    }
  }

  // Part 3e: Send notifications after respondent submission
  async sendRespondentSubmissionNotifications(caseId: string, respondentId: string) {
    try {
      const caseData = await this.prisma.arbitration.findUnique({
        where: { id: caseId },
        include: {
          user: true, // Claimant
          respondentCases: {
            where: { respondentId },
            include: { respondent: true }
          }
        }
      });

      if (!caseData || caseData.respondentCases.length === 0) {
        throw new Error(`Case or respondent not found`);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const caseNumber = caseData.caseNumber || caseId.slice(-8);
      const respondentCase = caseData.respondentCases[0];
      const counterResponseDays = 14; // 14 days for counter-response
      
      const counterResponseDeadline = new Date();
      counterResponseDeadline.setDate(counterResponseDeadline.getDate() + counterResponseDays);

      // Email to Respondent (confirmation)
      const respondentEmailData = {
        respondentName: respondentCase.respondentName,
        caseNumber,
        counterResponseDays: counterResponseDays.toString(),
        frontendUrl
      };

      await this.emailService.sendEmail({
        to: respondentCase.respondentEmail,
        subject: generateEmailContent(emailTemplates.respondentSubmission.subject, { caseNumber }),
        html: generateEmailContent(emailTemplates.respondentSubmission.toRespondent, respondentEmailData)
      });

      // Email to Claimant (notification to submit counter-response)
      const claimantEmailData = {
        claimantName: caseData.user.name,
        caseNumber,
        counterResponseDays: counterResponseDays.toString(),
        counterResponseDeadline: counterResponseDeadline.toLocaleDateString(),
        claimantUrl: frontendUrl,
        caseId
      };

      await this.emailService.sendEmail({
        to: caseData.user.email,
        subject: generateEmailContent(emailTemplates.respondentSubmission.subject, { caseNumber }),
        html: generateEmailContent(emailTemplates.respondentSubmission.toClaimant, claimantEmailData)
      });

      // Update case status for counter-response phase
      await this.prisma.arbitration.update({
        where: { id: caseId },
        data: {
          status: 'AWAITING_COUNTER_RESPONSE'
        }
      });

      console.log(`Respondent submission notifications sent for case ${caseNumber}`);
      return { success: true, message: 'Notifications sent successfully' };

    } catch (error) {
      console.error('Error sending respondent submission notifications:', error);
      throw error;
    }
  }

  // Part 4d: Send notifications after counter-response submission
  async sendCounterResponseSubmissionNotifications(caseId: string) {
    try {
      const caseData = await this.prisma.arbitration.findUnique({
        where: { id: caseId },
        include: {
          user: true, // Claimant
          respondentCases: {
            include: { respondent: true }
          }
        }
      });

      if (!caseData) {
        throw new Error(`Case not found: ${caseId}`);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const caseNumber = caseData.caseNumber || caseId.slice(-8);

      // Email to all parties (claimant and respondents)
      const allParties = [
        { name: caseData.user.name, email: caseData.user.email, role: 'Claimant' },
        ...caseData.respondentCases.map(rc => ({
          name: rc.respondentName,
          email: rc.respondentEmail,
          role: 'Respondent'
        }))
      ];

      for (const party of allParties) {
        const emailData = {
          recipientName: party.name,
          caseNumber,
          frontendUrl,
          caseId
        };

        await this.emailService.sendEmail({
          to: party.email,
          subject: generateEmailContent(emailTemplates.counterResponseSubmission.subject, { caseNumber }),
          html: generateEmailContent(emailTemplates.counterResponseSubmission.toAll, emailData)
        });
      }

      // Update case status to ready for arbitration
      await this.prisma.arbitration.update({
        where: { id: caseId },
        data: {
          status: 'READY_FOR_ARBITRATION'
        }
      });

      console.log(`Counter-response submission notifications sent for case ${caseNumber}`);
      return { success: true, message: 'Notifications sent successfully' };

    } catch (error) {
      console.error('Error sending counter-response submission notifications:', error);
      throw error;
    }
  }

  // Send case access link to respondent
  async sendCaseAccessLink(email: string, caseId: string, recipientName: string) {
    try {
      const caseData = await this.prisma.arbitration.findUnique({
        where: { id: caseId }
      });

      if (!caseData) {
        throw new Error(`Case not found: ${caseId}`);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const caseNumber = caseData.caseNumber || caseId.slice(-8);
      const accessCode = this.generateAccessCode();
      const encryptedCaseNumber = this.encryptCaseNumber(caseNumber);
      const caseUrl = `${frontendUrl}/case/${encryptedCaseNumber}?code=${accessCode}`;

      const emailData = {
        recipientName,
        caseNumber,
        caseUrl,
        accessCode
      };

      await this.emailService.sendEmail({
        to: email,
        subject: generateEmailContent(emailTemplates.caseAccess.subject, { caseNumber }),
        html: generateEmailContent(emailTemplates.caseAccess.template, emailData)
      });

      return { success: true, accessCode, caseUrl };

    } catch (error) {
      console.error('Error sending case access link:', error);
      throw error;
    }
  }

  // Helper methods
  private generateAccessCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private encryptCaseNumber(caseNumber: string): string {
    // Simple base64 encoding for now - replace with proper encryption in production
    return Buffer.from(caseNumber).toString('base64').replace(/[+=]/g, '');
  }

  private extractDisputeValue(caseData: any): string {
    try {
      if (caseData.payment && typeof caseData.payment === 'object') {
        const payment = caseData.payment as any;
        if (payment.totalClaimAmount) {
          return `₹${payment.totalClaimAmount}`;
        }
      }
      return 'Not specified';
    } catch {
      return 'Not specified';
    }
  }
}
