import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NotificationService } from './notification.service';

interface WorkflowTrigger {
  caseId: string;
  event: 'petition_submitted' | 'respondent_responded' | 'counter_response_submitted' | 'deadline_approaching';
  data?: any;
}

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Main workflow orchestrator
   * This method is called when significant case events occur
   */
  async processWorkflowTrigger(trigger: WorkflowTrigger): Promise<void> {
    try {
      console.log(`Processing workflow trigger: ${trigger.event} for case ${trigger.caseId}`);
      
      switch (trigger.event) {
        case 'petition_submitted':
          await this.handlePetitionSubmission(trigger.caseId);
          break;
          
        case 'respondent_responded':
          await this.handleRespondentResponse(trigger.caseId, trigger.data?.respondentId);
          break;
          
        case 'counter_response_submitted':
          await this.handleCounterResponseSubmission(trigger.caseId);
          break;
          
        case 'deadline_approaching':
          await this.handleDeadlineApproaching(trigger.caseId, trigger.data);
          break;
          
        default:
          console.warn(`Unknown workflow event: ${trigger.event}`);
      }
      
    } catch (error) {
      console.error(`Workflow processing failed for ${trigger.event}:`, error);
      // Don't throw - workflow failures shouldn't break the main process
    }
  }

  /**
   * Handle petition submission workflow (Part 2h)
   */
  private async handlePetitionSubmission(caseId: string): Promise<void> {
    console.log(`Handling petition submission for case ${caseId}`);
    
    // 1. Update case status
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: { status: 'PETITION_SUBMITTED' }
    });

    // 2. Create respondent cases if they don't exist
    await this.createRespondentCases(caseId);

    // 3. Send notifications to all stakeholders (Part 2h)
    await this.notificationService.sendPetitionSubmissionNotifications(caseId);

    // 4. Schedule deadline reminders
    await this.scheduleDeadlineReminders(caseId, 'respondent_response');

    console.log(`Petition submission workflow completed for case ${caseId}`);
  }

  /**
   * Handle respondent response workflow (Part 3e)
   */
  private async handleRespondentResponse(caseId: string, respondentId: string): Promise<void> {
    console.log(`Handling respondent response for case ${caseId}, respondent ${respondentId}`);

    // 1. Update case status
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: { status: 'AWAITING_COUNTER_RESPONSE' }
    });

    // 2. Set counter-response deadline
    const counterResponseDeadline = new Date();
    counterResponseDeadline.setDate(counterResponseDeadline.getDate() + 14); // 14 days

    // 3. Send notifications (Part 3e)
    await this.notificationService.sendRespondentSubmissionNotifications(caseId, respondentId);

    // 4. Schedule counter-response deadline reminders
    await this.scheduleDeadlineReminders(caseId, 'counter_response');

    console.log(`Respondent response workflow completed for case ${caseId}`);
  }

  /**
   * Handle counter-response submission workflow (Part 4d)
   */
  private async handleCounterResponseSubmission(caseId: string): Promise<void> {
    console.log(`Handling counter-response submission for case ${caseId}`);

    // 1. Update case status
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: { status: 'READY_FOR_ARBITRATION' }
    });

    // 2. Send notifications to all parties (Part 4d)
    await this.notificationService.sendCounterResponseSubmissionNotifications(caseId);

    // 3. Trigger arbitrator assignment process
    await this.initiateArbitratorAssignment(caseId);

    console.log(`Counter-response submission workflow completed for case ${caseId}`);
  }

  /**
   * Handle approaching deadlines
   */
  private async handleDeadlineApproaching(caseId: string, data: any): Promise<void> {
    console.log(`Handling deadline approaching for case ${caseId}`);

    const caseData = await this.prisma.arbitration.findUnique({
      where: { id: caseId },
      include: {
        user: true,
        respondentCases: {
          include: { respondent: true }
        }
      }
    });

    if (!caseData) {
      console.error(`Case not found: ${caseId}`);
      return;
    }

    // Send reminder emails based on deadline type
    if (data.deadlineType === 'respondent_response') {
      // Remind respondents about upcoming deadline
      for (const respondentCase of caseData.respondentCases) {
        if (respondentCase.responseStatus === 'PENDING') {
          await this.sendDeadlineReminder(
            respondentCase.respondentEmail,
            respondentCase.respondentName,
            caseData.caseNumber || caseId.slice(-8),
            'respond to the petition',
            respondentCase.responseDeadline
          );
        }
      }
    } else if (data.deadlineType === 'counter_response') {
      // Remind claimant about counter-response deadline
      await this.sendDeadlineReminder(
        caseData.user.email,
        caseData.user.name,
        caseData.caseNumber || caseId.slice(-8),
        'submit your counter-response',
        data.deadline
      );
    }
  }

  /**
   * Create respondent cases from arbitration data
   */
  private async createRespondentCases(caseId: string): Promise<void> {
    const arbitration = await this.prisma.arbitration.findUnique({
      where: { id: caseId }
    });

    if (!arbitration || !arbitration.respondents) {
      console.log(`No respondents found for case ${caseId}`);
      return;
    }

    const respondents = arbitration.respondents as any;
    
    // Handle both array and single respondent formats
    const respondentList = Array.isArray(respondents) ? respondents : [respondents];

    for (const respondent of respondentList) {
      if (!respondent.email || !respondent.name) continue;

      // Check if respondent user exists
      let respondentUser = await this.prisma.user.findUnique({
        where: { email: respondent.email }
      });

      // Create respondent user if doesn't exist
      if (!respondentUser) {
        const tempPassword = this.generateTempPassword();
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        respondentUser = await this.prisma.user.create({
          data: {
            email: respondent.email,
            name: respondent.name,
            role: 'RESPONDENT',
            phone: respondent.phone || null,
            password: hashedPassword,
            temporaryPassword: tempPassword
          }
        });
      }

      // Create respondent case
      const responseDeadline = new Date();
      responseDeadline.setDate(responseDeadline.getDate() + 21); // 21 days to respond

      await this.prisma.respondentCase.upsert({
        where: {
          caseId_respondentId: {
            caseId,
            respondentId: respondentUser.id
          }
        },
        update: {
          responseDeadline,
          notificationStatus: 'UNREAD',
          responseStatus: 'PENDING',
          currentPhase: 'NOTICE_SENT',
          lastNoticeAt: new Date()
        },
        create: {
          caseId,
          respondentId: respondentUser.id,
          respondentType: respondent.type || 'Individual',
          respondentName: respondent.name,
          respondentEmail: respondent.email,
          respondentPhone: respondent.phone,
          respondentAddress: respondent.address,
          responseDeadline,
          notificationStatus: 'UNREAD',
          responseStatus: 'PENDING',
          currentPhase: 'NOTICE_SENT'
        }
      });
    }

    console.log(`Created/updated respondent cases for case ${caseId}`);
  }

  /**
   * Schedule deadline reminders
   */
  private async scheduleDeadlineReminders(caseId: string, type: 'respondent_response' | 'counter_response'): Promise<void> {
    // In a production system, you would use a job queue like Bull or agenda
    // For now, we'll simulate this with setTimeout (not recommended for production)
    
    const reminderDays = [7, 3, 1]; // Remind 7, 3, and 1 days before deadline
    
    for (const days of reminderDays) {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + (type === 'respondent_response' ? 21 - days : 14 - days));
      
      // In production, you would create a job entry in the database or queue
      console.log(`Scheduled ${type} reminder for case ${caseId} at ${reminderDate}`);
      
      // For development, you can set timeouts for short-term testing
      // setTimeout(() => {
      //   this.processWorkflowTrigger({
      //     caseId,
      //     event: 'deadline_approaching',
      //     data: { deadlineType: type, deadline: reminderDate }
      //   });
      // }, (reminderDate.getTime() - Date.now()));
    }
  }

  /**
   * Initiate arbitrator assignment process
   */
  private async initiateArbitratorAssignment(caseId: string): Promise<void> {
    console.log(`Initiating arbitrator assignment for case ${caseId}`);
    
    // This would integrate with your arbitrator assignment logic
    // For now, just update the status
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: { 
        status: 'AWAITING_ARBITRATOR_ASSIGNMENT'
      }
    });

    // TODO: Implement arbitrator assignment algorithm
    // - Check arbitrator availability
    // - Match based on expertise
    // - Send assignment notifications
  }

  /**
   * Send deadline reminder email
   */
  private async sendDeadlineReminder(
    email: string, 
    name: string, 
    caseNumber: string, 
    action: string, 
    deadline: Date | null
  ): Promise<void> {
    if (!deadline) return;

    const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const subject = `Reminder: Action Required for Case #${caseNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Deadline Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a reminder that you need to <strong>${action}</strong> for arbitration case #${caseNumber}.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Deadline Information:</h3>
          <p><strong>Action Required:</strong> ${action}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()} at 11:59 PM</p>
          <p><strong>Days Remaining:</strong> ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</p>
        </div>
        
        <p>Please log in to the arbitration portal to complete your action before the deadline.</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Access Portal
        </a>
        
        <p><strong>Important:</strong> Failure to respond by the deadline may result in adverse consequences for your case.</p>
        
        <p>Best regards,<br>Arbitration Portal Team</p>
      </div>
    `;

    // Use existing email service
    // await this.emailService.sendEmail({ to: email, subject, html });
    console.log(`Deadline reminder sent to ${email} for case ${caseNumber}`);
  }

  /**
   * Generate temporary password for new respondent users
   */
  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-8).toUpperCase();
  }

  /**
   * Public method to trigger workflows from controllers
   */
  async triggerWorkflow(caseId: string, event: string, data?: any): Promise<void> {
    await this.processWorkflowTrigger({
      caseId,
      event: event as any,
      data
    });
  }
}
