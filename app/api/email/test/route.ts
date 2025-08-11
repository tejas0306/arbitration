import { NextRequest, NextResponse } from 'next/server';
import EmailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { to, type = 'test', caseLink, caseData, caseNumber, email, otp, recipientType } = await request.json();

    // Only require 'to' for non-case-submission-all-parties types
    if (type !== 'case-submission-all-parties' && type !== 'otp-verification' && !to) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    switch (type) {
      case 'otp':
        // Test OTP email
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        success = await EmailService.sendOTPEmail(to, generatedOtp, 'email');
        message = success ? 'OTP email sent successfully' : 'Failed to send OTP email';
        return NextResponse.json({
          success,
          message,
          otp: success ? generatedOtp : null, // Return the OTP to frontend
          timestamp: new Date().toISOString()
        });
        break;

      case 'otp-verification':
        // OTP verification for respondent registration
        if (!email || !otp) {
          return NextResponse.json(
            { success: false, error: 'Email and OTP are required' },
            { status: 400 }
          );
        }
        console.log(`🔧 OTP verification - Sending to: ${email}`);
        success = await EmailService.sendOTPEmail(email, otp, 'email');
        message = success ? 'OTP verification email sent successfully' : 'Failed to send OTP verification email';
        return NextResponse.json({
          success,
          message,
          otp: success ? otp : null, // Return the OTP to frontend
          timestamp: new Date().toISOString()
        });
        break;

      case 'case-submission':
        // Test case submission email
        const testCaseData = {
          claimant: { name: 'Test Claimant' }
        };
        success = await EmailService.sendCaseSubmissionEmail(to, 'TEST-001', testCaseData);
        message = success ? 'Case submission email sent successfully' : 'Failed to send case submission email';
        break;

      case 'case-submission-all-parties':
        try {
          // Send case submission emails to all parties using actual form data
          const actualCaseData = caseData || {
            claimant: { name: 'Test Claimant', email: to },
            additionalClaimants: [
              { name: 'Additional Claimant 1', email: to },
              { name: 'Additional Claimant 2', email: to }
            ],
            managerDetails: { name: 'Test Manager', email: to },
            respondentDetails: [
              { name: 'Respondent 1', email: to },
              { name: 'Respondent 2', email: to }
            ]
          };
          const actualCaseNumber = caseNumber || 'TEST-001';
          const actualCaseLink = caseLink || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/cases/${actualCaseNumber}`;
          
          console.log('🔧 Sending emails with data:', { actualCaseNumber, actualCaseData, actualCaseLink });
          
          const result = await EmailService.sendCaseSubmissionToAllParties(actualCaseNumber, actualCaseData, actualCaseLink);
          success = result.success;
          message = success ? 'Case submission emails sent to all parties successfully' : 'Failed to send emails to all parties';
          
          // Log the results for debugging
          console.log('🔧 Email sending results:', result);
        } catch (error) {
          console.error('🔧 Error in case-submission-all-parties:', error);
          success = false;
          message = `Error sending emails: ${error}`;
        }
        break;

      case 'draft-saved':
        // Test draft saved email
        success = await EmailService.sendDraftSavedEmail(to, 'DRAFT-001');
        message = success ? 'Draft saved email sent successfully' : 'Failed to send draft saved email';
        break;

      case 'status-update':
        // Test status update email
        success = await EmailService.sendCaseStatusUpdate(to, 'TEST-001', 'Under Review', 'Your case is being reviewed by our team.');
        message = success ? 'Status update email sent successfully' : 'Failed to send status update email';
        break;

      default:
        // Test simple email
        success = await EmailService.sendEmail({
          to,
          subject: 'Arbitration Portal - Email Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">Email Test Successful</h2>
                <p style="color: #666; margin-bottom: 20px;">
                  This is a test email from the Arbitration Portal.
                </p>
                <p style="color: #007bff; font-weight: bold;">
                  SMTP configuration is working correctly!
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                  Test sent at: ${new Date().toLocaleString()}
                </p>
              </div>
            </div>
          `
        });
        message = success ? 'Test email sent successfully' : 'Failed to send test email';
        break;
    }

    return NextResponse.json({
      success,
      message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test SMTP connection
    const connectionTest = await EmailService.testConnection();
    
    return NextResponse.json({
      success: connectionTest,
      message: connectionTest ? 'SMTP connection successful' : 'SMTP connection failed',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
      }
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json(
      { success: false, error: 'SMTP test failed' },
      { status: 500 }
    );
  }
} 