import { Injectable } from '@nestjs/common';

export interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface UserCredentialsData {
  name: string;
  email: string;
  password: string;
  role: string;
  organization: string;
  loginUrl: string;
}

export interface PasswordResetData {
  name: string;
  email: string;
  newPassword: string;
  loginUrl: string;
}

@Injectable()
export class EmailService {
  constructor() {
    // TODO: Initialize email service provider (NodeMailer, SendGrid, etc.)
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // TODO: Implement actual email sending logic
      console.log('📧 Email Service - Sending email:', {
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text || 'No text content',
        html: emailData.html || 'No HTML content'
      });
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error('📧 Email Service - Failed to send email:', error);
      return false;
    }
  }

  async sendUserCredentials(userData: UserCredentialsData): Promise<boolean> {
    const subject = `Welcome to Arbitration Portal - Your Account Credentials`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Arbitration Portal</h1>
        
        <p>Dear ${userData.name},</p>
        
        <p>Your account has been created successfully! Here are your login credentials:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Account Details</h3>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${userData.password}</code></p>
          <p><strong>Role:</strong> ${userData.role}</p>
          <p><strong>Organization:</strong> ${userData.organization}</p>
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.</p>
        </div>
        
        <a href="${userData.loginUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Login to Your Account
        </a>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions or need assistance, please contact the system administrator.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          Arbitration Portal Team
        </p>
      </div>
    `;

    const textContent = `
Welcome to Arbitration Portal

Dear ${userData.name},

Your account has been created successfully! Here are your login credentials:

Email: ${userData.email}
Temporary Password: ${userData.password}
Role: ${userData.role}
Organization: ${userData.organization}

Login URL: ${userData.loginUrl}

⚠️ Security Notice: Please change your password after your first login for security purposes.

If you have any questions or need assistance, please contact the system administrator.

Best regards,
Arbitration Portal Team
    `;

    return this.sendEmail({
      to: userData.email,
      subject,
      text: textContent,
      html: htmlContent
    });
  }

  async sendPasswordReset(resetData: PasswordResetData): Promise<boolean> {
    const subject = `Arbitration Portal - Password Reset Notification`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Password Reset Notification</h1>
        
        <p>Dear ${resetData.name},</p>
        
        <p>Your password has been reset by an administrator. Here are your new login credentials:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">New Credentials</h3>
          <p><strong>Email:</strong> ${resetData.email}</p>
          <p><strong>New Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${resetData.newPassword}</code></p>
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Security Notice:</strong> Please change your password immediately after logging in for security purposes.</p>
        </div>
        
        <a href="${resetData.loginUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Login with New Password
        </a>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          If you did not request this password reset, please contact the system administrator immediately.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          Arbitration Portal Team
        </p>
      </div>
    `;

    const textContent = `
Password Reset Notification

Dear ${resetData.name},

Your password has been reset by an administrator. Here are your new login credentials:

Email: ${resetData.email}
New Password: ${resetData.newPassword}

Login URL: ${resetData.loginUrl}

⚠️ Security Notice: Please change your password immediately after logging in for security purposes.

If you did not request this password reset, please contact the system administrator immediately.

Best regards,
Arbitration Portal Team
    `;

    return this.sendEmail({
      to: resetData.email,
      subject,
      text: textContent,
      html: htmlContent
    });
  }

  async sendBulkNotification(recipients: string[], subject: string, message: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Arbitration Portal Notification</h1>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message}
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          Arbitration Portal Team
        </p>
      </div>
    `;

    const textContent = `
Arbitration Portal Notification

${message}

Best regards,
Arbitration Portal Team
    `;

    return this.sendEmail({
      to: recipients,
      subject,
      text: textContent,
      html: htmlContent
    });
  }
} 