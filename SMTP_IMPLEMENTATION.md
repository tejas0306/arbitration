# SMTP Email Implementation

## Overview
This document describes the SMTP email functionality implemented for the Arbitration Portal using Gmail SMTP.

## Configuration

### Environment Variables (.env)
```env
# SMTP Configuration for Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bdo.daily.update@gmail.com
SMTP_PASS=dqdj llcj qkab uiws
SMTP_FROM=bdo.daily.update@gmail.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here
```

## Implementation Details

### 1. Email Service (`lib/email-service.ts`)
- **EmailService Class**: Centralized email functionality
- **SMTP Configuration**: Uses Gmail SMTP with provided credentials
- **Email Templates**: Professional HTML templates for different email types

### 2. Email Types Supported

#### OTP Email
- Used for email verification during form submission
- Professional template with OTP code display
- 10-minute expiration notice

#### Case Submission Email
- Sent when arbitration case is successfully submitted
- Includes case number, claimant details, and submission date
- Professional confirmation template

#### Draft Saved Email
- Sent when draft is saved successfully
- Includes draft ID and saved date
- Allows users to continue editing later

#### Status Update Email
- Sent when case status changes
- Includes case number, new status, and update date
- Optional custom message support

### 3. API Endpoints

#### `/api/email/test` (GET)
- Tests SMTP connection
- Returns connection status and configuration details

#### `/api/email/test` (POST)
- Sends test emails
- Supports different email types:
  - `test`: Simple test email
  - `otp`: OTP verification email
  - `case-submission`: Case submission confirmation
  - `draft-saved`: Draft saved notification
  - `status-update`: Status update notification

### 4. Integration Points

#### Arbitration Form (`components/arbitration-form.tsx`)
- **Email Verification**: Sends OTP emails for claimant email verification
- **Case Submission**: Sends confirmation emails when cases are submitted
- **Error Handling**: Graceful error handling for email failures

#### Test Page (`app/test-email/page.tsx`)
- **SMTP Connection Test**: Verify SMTP configuration
- **Email Testing**: Send different types of test emails
- **Result Display**: Shows success/error status and details

## Usage

### Testing Email Functionality
1. Visit `/test-email` in your browser
2. Test SMTP connection first
3. Enter email address and select email type
4. Send test email and view results

### In Application
- Email verification is automatically triggered during form submission
- Case submission confirmation is sent automatically
- All email operations include error handling

## Security Considerations

### Gmail App Password
- Uses Gmail App Password instead of regular password
- More secure than 2FA for application use
- Specific to this application

### Environment Variables
- All sensitive data stored in `.env` file
- Not committed to version control
- Different configurations for development/production

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Verify Gmail credentials
   - Check if 2FA is enabled (use App Password)
   - Ensure port 587 is not blocked

2. **Email Not Received**
   - Check spam folder
   - Verify email address format
   - Check Gmail account settings

3. **App Password Issues**
   - Generate new App Password in Gmail
   - Ensure "Less secure app access" is not needed
   - Use 16-character App Password

### Testing Steps
1. Restart development server after configuration changes
2. Test SMTP connection first
3. Send test email to verify functionality
4. Check email delivery and formatting

## Production Deployment

### Environment Variables
```env
# Production SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bdo.daily.update@gmail.com
SMTP_PASS=dqdj llcj qkab uiws
SMTP_FROM=bdo.daily.update@gmail.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
```

### Security Checklist
- [ ] Use production NEXTAUTH_SECRET
- [ ] Set correct NEXTAUTH_URL for production domain
- [ ] Verify SMTP credentials work in production
- [ ] Test email delivery in production environment
- [ ] Monitor email sending logs

## Email Templates

All email templates are HTML-based with:
- Professional styling
- Responsive design
- Clear branding
- Error handling
- Accessibility considerations

## Future Enhancements

1. **Email Queue System**: For high-volume email sending
2. **Template Management**: Dynamic email templates
3. **Email Analytics**: Track email delivery and open rates
4. **Multi-language Support**: Internationalized email templates
5. **Attachment Support**: Send documents with emails 