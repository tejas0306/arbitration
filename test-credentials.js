require('dotenv').config();

console.log('=== Gmail SMTP Credentials Test ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM);
console.log('');

// Test with different authentication methods
const nodemailer = require('nodemailer');

// Method 1: Direct SMTP
console.log('Testing Method 1: Direct SMTP...');
const transporter1 = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter1.verify()
  .then(() => {
    console.log('✅ Method 1: Direct SMTP - SUCCESS');
  })
  .catch((error) => {
    console.log('❌ Method 1: Direct SMTP - FAILED');
    console.log('Error:', error.message);
  });

// Method 2: Gmail Service
console.log('\nTesting Method 2: Gmail Service...');
const transporter2 = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter2.verify()
  .then(() => {
    console.log('✅ Method 2: Gmail Service - SUCCESS');
  })
  .catch((error) => {
    console.log('❌ Method 2: Gmail Service - FAILED');
    console.log('Error:', error.message);
  });

// Method 3: OAuth2 (if credentials available)
if (process.env.GMAIL_CLIENT_ID) {
  console.log('\nTesting Method 3: OAuth2...');
  const transporter3 = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.SMTP_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: process.env.GMAIL_ACCESS_TOKEN
    }
  });

  transporter3.verify()
    .then(() => {
      console.log('✅ Method 3: OAuth2 - SUCCESS');
    })
    .catch((error) => {
      console.log('❌ Method 3: OAuth2 - FAILED');
      console.log('Error:', error.message);
    });
} else {
  console.log('\nMethod 3: OAuth2 - SKIPPED (credentials not available)');
} 