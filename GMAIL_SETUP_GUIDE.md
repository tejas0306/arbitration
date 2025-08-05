# Gmail SMTP Setup Guide

## Current Issue
The Gmail SMTP authentication is failing because the credentials are not properly configured.

## Solution Options

### Option 1: App Password (Recommended for Development)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

#### Step 2: Generate App Password
1. Go to Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Click "Generate new app password"
4. Select "Mail" as the app
5. Copy the 16-character password (without spaces)

#### Step 3: Update .env File
Replace `YOUR_NEW_APP_PASSWORD_HERE` in your .env file with the generated App Password:

```env
SMTP_PASS=your16characterapppassword
```

### Option 2: OAuth2 (Recommended for Production)

#### Step 1: Create Google Cloud Project
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Gmail API

#### Step 2: Create OAuth2 Credentials
1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Download the credentials JSON file

#### Step 3: Update .env File
Add OAuth2 credentials to your .env file:

```env
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_ACCESS_TOKEN=your_access_token
```

### Option 3: Less Secure App Access (Not Recommended)
⚠️ **This is deprecated by Google and not recommended**

1. Go to your Google Account settings
2. Navigate to Security
3. Turn on "Less secure app access"
4. Use your regular Gmail password

## Testing the Setup

### Test with Simple Script
```bash
node test-email-simple.js
```

### Test with API
```bash
curl -X GET http://localhost:3000/api/email/test
```

### Test with Web Interface
Visit: http://localhost:3000/test-email

## Troubleshooting

### Common Errors

1. **"Username and Password not accepted"**
   - Use App Password instead of regular password
   - Ensure 2FA is enabled

2. **"Invalid credentials"**
   - Check if App Password is correct
   - Ensure no extra spaces in password

3. **"Connection timeout"**
   - Check firewall settings
   - Ensure port 587 is not blocked

### Security Best Practices

1. **Use App Passwords** instead of regular passwords
2. **Enable 2FA** on your Google account
3. **Use OAuth2** for production applications
4. **Never commit credentials** to version control
5. **Rotate credentials** regularly

## Current Status

- ✅ SMTP service implemented
- ✅ Email templates created
- ✅ API endpoints ready
- ❌ Gmail authentication needs configuration

## Next Steps

1. **Generate App Password** from your Gmail account
2. **Update .env file** with the new password
3. **Test the connection** using the test script
4. **Verify email delivery** in your inbox

## Support

If you continue to have issues:
1. Check Gmail account settings
2. Verify App Password generation
3. Test with a different Gmail account
4. Consider using a different email service (SendGrid, Mailgun, etc.) 