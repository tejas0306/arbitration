import nodemailer from 'nodemailer';

// OAuth2 configuration for Gmail
const oauth2Config = {
  type: 'OAuth2',
  user: process.env.SMTP_USER || 'bdo.daily.update@gmail.com',
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  accessToken: process.env.GMAIL_ACCESS_TOKEN,
};

// Email configuration with OAuth2
const emailConfig = {
  service: 'gmail',
  auth: oauth2Config,
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
export class EmailServiceOAuth {
  /**
   * Send email using SMTP with OAuth2
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
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      console.log('SMTP OAuth2 connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP OAuth2 connection failed:', error);
      return false;
    }
  }
}

export default EmailServiceOAuth; 