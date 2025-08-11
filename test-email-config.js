const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'bdo.daily.update@gmail.com',
    pass: 'vbontjtdbbdulpga',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

async function testEmail() {
  try {
    console.log('🔧 Testing email configuration...');
    console.log('🔧 SMTP User:', emailConfig.auth.user);
    console.log('🔧 SMTP Pass:', emailConfig.auth.pass ? '***' : 'NOT SET');
    
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    
    // Send test email
    const mailOptions = {
      from: 'bdo.daily.update@gmail.com',
      to: 'test@example.com', // Change this to your email
      subject: 'Test Email from Arbitration Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Test Email</h2>
            <p style="color: #666; margin-bottom: 20px;">
              This is a test email from the Arbitration Portal.
            </p>
            <p style="color: #007bff; font-weight: bold;">
              If you receive this email, the SMTP configuration is working correctly!
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Test sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', info.messageId);
    console.log('📧 Email sent to:', mailOptions.to);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmail(); 