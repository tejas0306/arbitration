import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'bdo.daily.update@gmail.com',
    pass: process.env.SMTP_PASS || 'vbontjtdbbdulpga',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email service interface
interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Email service class
export class EmailService {
  /**
   * Send email using SMTP
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'bdo.daily.update@gmail.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send OTP email
   */
  static async sendOTPEmail(to: string, otp: string, type: 'email' | 'phone' = 'email'): Promise<boolean> {
    const subject = `Arbitration Portal - ${type === 'email' ? 'Email' : 'Phone'} Verification OTP`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">Arbitration Portal Verification</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Your verification code is:
          </p>
          <div style="background-color: #007bff; color: white; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">
            This code will expire in 10 minutes. Please do not share this code with anyone.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you didn't request this verification, please ignore this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Send case submission confirmation
   */
  static async sendCaseSubmissionEmail(to: string, caseNumber: string, caseData: any, caseLink?: string, recipientType: 'claimant' | 'respondent' | 'manager' = 'claimant'): Promise<boolean> {
    try {
      const subject = `Arbitration Case Submitted - Case #${caseNumber}`;
      
      // Generate case link if not provided
      const finalCaseLink = caseLink || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/cases/${caseNumber}`;
      
      // Different templates for different recipient types
      let html = '';
      
      if (recipientType === 'claimant') {
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Arbitration Portal</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Case Submission Notification</p>
              </div>
              
              <div style="border-left: 4px solid #2563eb; padding-left: 20px; margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">Case Successfully Submitted</h2>
                <p style="color: #374151; margin: 0; line-height: 1.6;">
                  Your arbitration case has been successfully submitted and is now under review.
                </p>
              </div>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Case Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Case Number:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${caseNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Submission Date:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Status:</td>
                    <td style="padding: 8px 0; color: #059669; font-weight: 600;">Submitted for Review</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #0ea5e9;">
                <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 16px;">📋 View Your Case</h3>
                <p style="color: #0c4a6e; margin: 0 0 15px 0; line-height: 1.6; font-size: 14px;">
                  Click the button below to view your case details and track its progress:
                </p>
                <div style="text-align: center;">
                  <a href="${finalCaseLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                    🔍 View Case Details
                  </a>
                </div>
                <p style="color: #0c4a6e; margin: 15px 0 0 0; font-size: 12px; text-align: center;">
                  Or copy this link: <a href="${finalCaseLink}" style="color: #2563eb;">${finalCaseLink}</a>
                </p>
              </div>

              <div style="margin-bottom: 25px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Next Steps</h3>
                <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Your case will be reviewed by our arbitration team</li>
                  <li>You will receive updates on the case status</li>
                  <li>Additional documentation may be requested if needed</li>
                  <li>Hearing dates will be communicated once scheduled</li>
                </ul>
              </div>

              <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Important Information</h3>
                <p style="color: #1e40af; margin: 0; line-height: 1.6; font-size: 14px;">
                  Please keep this case number for future reference. All communications regarding this case will include this reference number.
                </p>
              </div>

              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">
                  This is an automated notification from the Arbitration Portal.<br>
                  Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `;
      } else if (recipientType === 'respondent') {
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin: 0; font-size: 24px;">Arbitration Portal</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Case Notification</p>
              </div>
              
              <div style="border-left: 4px solid #dc2626; padding-left: 20px; margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">Arbitration Case Filed</h2>
                <p style="color: #374151; margin: 0; line-height: 1.6;">
                  An arbitration case has been filed against you and is now under review.
                </p>
              </div>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Case Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Case Number:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${caseNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Filing Date:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Status:</td>
                    <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">Under Review</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #fecaca;">
                <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 16px;">⚠️ Important Notice</h3>
                <p style="color: #991b1b; margin: 0 0 15px 0; line-height: 1.6; font-size: 14px;">
                  You are named as a respondent in this arbitration case. Please review the case details and prepare your response.
                </p>
                <div style="text-align: center;">
                  <a href="${finalCaseLink}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                    📋 View Case Details
                  </a>
                </div>
                <p style="color: #991b1b; margin: 15px 0 0 0; font-size: 12px; text-align: center;">
                  Or copy this link: <a href="${finalCaseLink}" style="color: #dc2626;">${finalCaseLink}</a>
                </p>
              </div>

              <div style="margin-bottom: 25px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Required Actions</h3>
                <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Review the case details and allegations</li>
                  <li>Prepare your response within the specified timeframe</li>
                  <li>Submit any relevant documentation</li>
                  <li>Attend scheduled hearings as notified</li>
                </ul>
              </div>

              <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">Important Information</h3>
                <p style="color: #991b1b; margin: 0; line-height: 1.6; font-size: 14px;">
                  Please take this matter seriously. Failure to respond may result in default proceedings. Keep this case number for all future communications.
                </p>
              </div>

              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">
                  This is an automated notification from the Arbitration Portal.<br>
                  Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `;
      } else if (recipientType === 'manager') {
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #059669; margin: 0; font-size: 24px;">Arbitration Portal</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Case Management Notification</p>
              </div>
              
              <div style="border-left: 4px solid #059669; padding-left: 20px; margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">Case Assigned for Management</h2>
                <p style="color: #374151; margin: 0; line-height: 1.6;">
                  A new arbitration case has been assigned to you for management and oversight.
                </p>
              </div>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Case Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Case Number:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${caseNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Assignment Date:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: 600;">Status:</td>
                    <td style="padding: 8px 0; color: #059669; font-weight: 600;">Assigned for Management</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #bbf7d0;">
                <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">📊 Manage Case</h3>
                <p style="color: #166534; margin: 0 0 15px 0; line-height: 1.6; font-size: 14px;">
                  Access the case management dashboard to review details and coordinate proceedings:
                </p>
                <div style="text-align: center;">
                  <a href="${finalCaseLink}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                    🎛️ Manage Case
                  </a>
                </div>
                <p style="color: #166534; margin: 15px 0 0 0; font-size: 12px; text-align: center;">
                  Or copy this link: <a href="${finalCaseLink}" style="color: #059669;">${finalCaseLink}</a>
                </p>
              </div>

              <div style="margin-bottom: 25px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Management Tasks</h3>
                <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Review case documentation and submissions</li>
                  <li>Coordinate with all parties involved</li>
                  <li>Schedule hearings and proceedings</li>
                  <li>Monitor case progress and timelines</li>
                </ul>
              </div>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 16px;">Important Information</h3>
                <p style="color: #166534; margin: 0; line-height: 1.6; font-size: 14px;">
                  You are responsible for the overall management of this case. Please ensure all parties are properly notified and proceedings are conducted efficiently.
                </p>
              </div>

              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 12px;">
                  This is an automated notification from the Arbitration Portal.<br>
                  Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `;
      }

      return await EmailService.sendEmail({
        to,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending case submission email:', error);
      return false;
    }
  }

  static async sendCaseSubmissionToAllParties(caseNumber: string, caseData: any, caseLink?: string): Promise<{
    success: boolean;
    results: {
      claimant: boolean;
      additionalClaimants: boolean[];
      manager: boolean;
      respondent: boolean[];
    };
    errors: string[];
  }> {
    const results = {
      claimant: false,
      additionalClaimants: [] as boolean[],
      manager: false,
      respondent: [] as boolean[]
    };
    const errors: string[] = [];

    try {
      // Send to main claimant
      if (caseData.claimant?.email) {
        try {
          results.claimant = await EmailService.sendCaseSubmissionEmail(
            caseData.claimant.email,
            caseNumber,
            caseData,
            caseLink,
            'claimant'
          );
          if (!results.claimant) {
            errors.push(`Failed to send email to claimant: ${caseData.claimant.email}`);
          }
        } catch (error) {
          errors.push(`Error sending email to claimant: ${error}`);
        }
      }

      // Send to additional claimants
      if (caseData.additionalClaimants && Array.isArray(caseData.additionalClaimants)) {
        for (let i = 0; i < caseData.additionalClaimants.length; i++) {
          const claimant = caseData.additionalClaimants[i];
          if (claimant?.email) {
            try {
                             const success = await EmailService.sendCaseSubmissionEmail(
                 claimant.email,
                 caseNumber,
                 caseData,
                 caseLink,
                 'claimant'
               );
              results.additionalClaimants[i] = success;
              if (!success) {
                errors.push(`Failed to send email to additional claimant ${i + 1}: ${claimant.email}`);
              }
            } catch (error) {
              results.additionalClaimants[i] = false;
              errors.push(`Error sending email to additional claimant ${i + 1}: ${error}`);
            }
          } else {
            results.additionalClaimants[i] = false;
          }
        }
      }

      // Send to manager
      if (caseData.managerDetails && Array.isArray(caseData.managerDetails) && caseData.managerDetails.length > 0) {
        for (let i = 0; i < caseData.managerDetails.length; i++) {
          const manager = caseData.managerDetails[i];
          if (manager?.email) {
            try {
              results.manager = await EmailService.sendCaseSubmissionEmail(
                manager.email,
                caseNumber,
                caseData,
                caseLink,
                'manager'
              );
              if (!results.manager) {
                errors.push(`Failed to send email to manager ${i + 1}: ${manager.email}`);
              }
            } catch (error) {
              errors.push(`Error sending email to manager ${i + 1}: ${error}`);
            }
          }
        }
      }

      // Send to respondents
      if (caseData.respondents && Array.isArray(caseData.respondents)) {
        for (let i = 0; i < caseData.respondents.length; i++) {
          const respondent = caseData.respondents[i];
          if (respondent?.email) {
            try {
                             const success = await EmailService.sendCaseSubmissionEmail(
                 respondent.email,
                 caseNumber,
                 caseData,
                 caseLink,
                 'respondent'
               );
              results.respondent[i] = success;
              if (!success) {
                errors.push(`Failed to send email to respondent ${i + 1}: ${respondent.email}`);
              }
            } catch (error) {
              results.respondent[i] = false;
              errors.push(`Error sending email to respondent ${i + 1}: ${error}`);
            }
          } else {
            results.respondent[i] = false;
          }
        }
      }

      const overallSuccess = results.claimant || 
                           results.additionalClaimants.some(success => success) ||
                           results.manager ||
                           results.respondent.some(success => success);

      return {
        success: overallSuccess,
        results,
        errors
      };

    } catch (error) {
      console.error('Error sending case submission emails to all parties:', error);
      return {
        success: false,
        results,
        errors: [...errors, `General error: ${error}`]
      };
    }
  }

  /**
   * Send draft saved notification
   */
  static async sendDraftSavedEmail(to: string, draftId: string): Promise<boolean> {
    const subject = 'Arbitration Draft Saved Successfully';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Draft Saved Successfully</h2>
          <p style="color: #666; margin-bottom: 15px;">
            Your arbitration draft has been saved successfully. You can continue editing it later.
          </p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Draft ID:</strong> ${draftId}</p>
            <p><strong>Saved Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            You can access your draft anytime through the portal to continue editing or submit your case.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Send case status update
   */
  static async sendCaseStatusUpdate(to: string, caseNumber: string, status: string, message?: string): Promise<boolean> {
    const subject = `Case Status Update - ${caseNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Case Status Update</h2>
          <p style="color: #666; margin-bottom: 15px;">
            Your arbitration case status has been updated.
          </p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Case Number:</strong> ${caseNumber}</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 14px;">
            You can view the complete details of your case through the portal.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }
}

export default EmailService; 