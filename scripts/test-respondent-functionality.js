const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Creating test data for respondent functionality...\n');

    // 1. Create a test claimant user
    const claimant = await prisma.user.upsert({
      where: { email: 'test.claimant@example.com' },
      update: {},
      create: {
        email: 'test.claimant@example.com',
        name: 'John Claimant',
        role: 'CLAIMANT',
        organization: 'Claimant Corp',
        phone: '+1234567890',
        password: 'password123'
      }
    });

    console.log('✅ Created claimant user:', claimant.email);

    // 2. Create a test respondent user
    const respondent = await prisma.user.upsert({
      where: { email: 'test.respondent@example.com' },
      update: {},
      create: {
        email: 'test.respondent@example.com',
        name: 'Jane Respondent',
        role: 'RESPONDENT',
        organization: 'Respondent LLC',
        phone: '+0987654321',
        password: 'password123'
      }
    });

    console.log('✅ Created respondent user:', respondent.email);

    // 3. Create a test arbitration case
    const arbitrationCase = await prisma.arbitration.create({
      data: {
        name: 'Test Commercial Dispute',
        type: 'COMMERCIAL',
        status: 'SUBMITTED',
        userId: claimant.id,
        caseNumber: `ARB-${Date.now()}`,
        pincode: '12345',
        address1: '123 Test Street',
        city: 'Test City',
        district: 'Test District',
        state: 'Test State',
        country: 'Test Country',
        email: claimant.email,
        phoneCountryCode: '+1',
        phone: '1234567890',
        additionalClaimants: [],
        respondents: [{
          name: respondent.name,
          email: respondent.email,
          organization: respondent.organization,
          phone: respondent.phone
        }],
        arbitrationAgreement: { text: 'Standard arbitration agreement for commercial disputes.' },
        disputeDetails: { summary: 'This is a test dispute involving commercial contract breach.' },
        isDraft: false
      }
    });

    console.log('✅ Created arbitration case:', arbitrationCase.caseNumber);

    // 4. Create respondent case assignment
    const respondentCase = await prisma.respondentCase.create({
      data: {
        respondentId: respondent.id,
        caseId: arbitrationCase.id,
        responseStatus: 'PENDING',
        currentPhase: 'NOTICE_SENT',
        noticeServedAt: new Date(),
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        noticeAttempts: 1
      }
    });

    console.log('✅ Created respondent case assignment');

    // 5. Create a test notification
    const notification = await prisma.caseNotification.create({
      data: {
        title: 'New Case Assignment',
        message: `You have been assigned to case ${arbitrationCase.caseNumber}. Please review and respond within 30 days.`,
        type: 'CASE_NOTICE',
        recipientId: respondent.id,
        senderId: claimant.id,
        caseId: arbitrationCase.id,
        status: 'SENT',
        metadata: {
          caseId: arbitrationCase.id,
          caseNumber: arbitrationCase.caseNumber
        }
      }
    });

    console.log('✅ Created notification for respondent');

    // 6. Create a sample case response (to test submitted responses)
    const caseResponse = await prisma.caseResponse.create({
      data: {
        caseId: arbitrationCase.id,
        respondentId: respondent.id,
        responseText: 'This is a test response to the arbitration case. We dispute the allegations and will provide evidence.',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        contactPreferences: {
          email: true,
          phone: true,
          preferredTime: 'business_hours'
        }
      }
    });

    console.log('✅ Created case response');

    // 7. Create additional test case for variety
    const secondCase = await prisma.arbitration.create({
      data: {
        name: 'Test Employment Dispute',
        type: 'EMPLOYMENT',
        status: 'SUBMITTED',
        userId: claimant.id,
        caseNumber: `ARB-${Date.now() + 1}`,
        pincode: '12345',
        address1: '123 Test Street',
        city: 'Test City',
        district: 'Test District',
        state: 'Test State',
        country: 'Test Country',
        email: claimant.email,
        phoneCountryCode: '+1',
        phone: '1234567890',
        additionalClaimants: [],
        respondents: [{
          name: respondent.name,
          email: respondent.email,
          organization: respondent.organization,
          phone: respondent.phone
        }],
        arbitrationAgreement: { text: 'Standard arbitration agreement for employment disputes.' },
        disputeDetails: { summary: 'Employment contract dispute regarding termination.' },
        isDraft: false
      }
    });

    const secondRespondentCase = await prisma.respondentCase.create({
      data: {
        respondentId: respondent.id,
        caseId: secondCase.id,
        responseStatus: 'PENDING',
        currentPhase: 'RESPONSE_PENDING',
        noticeServedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        responseDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
        noticeAttempts: 2
      }
    });

    console.log('✅ Created second test case (overdue)');

    console.log('\n🎉 Test data creation completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Claimant User: ${claimant.email} (ID: ${claimant.id})`);
    console.log(`- Respondent User: ${respondent.email} (ID: ${respondent.id})`);
    console.log(`- Test Case 1: ${arbitrationCase.caseNumber} (ID: ${arbitrationCase.id})`);
    console.log(`- Test Case 2: ${secondCase.caseNumber} (ID: ${secondCase.id})`);
    console.log(`- Respondent Cases: 2 (1 pending, 1 overdue)`);
    console.log(`- Case Responses: 1 submitted`);
    console.log(`- Notifications: 1 sent`);

    console.log('\n🔗 Test URLs:');
    console.log('- Respondent Dashboard: http://localhost:3000/respondent/dashboard');
    console.log(`- Case 1 Details: http://localhost:3000/respondent/case/${arbitrationCase.id}`);
    console.log(`- Case 2 Details: http://localhost:3000/respondent/case/${secondCase.id}`);

    console.log('\n🔑 Test Credentials:');
    console.log('- Claimant: test.claimant@example.com / password123');
    console.log('- Respondent: test.respondent@example.com / password123');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function verifyTestData() {
  try {
    console.log('\n🔍 Verifying test data...');

    // Check respondent users
    const respondentUsers = await prisma.user.findMany({
      where: { role: 'RESPONDENT' }
    });
    console.log(`✅ Found ${respondentUsers.length} respondent users`);

    // Check respondent cases
    const respondentCases = await prisma.respondentCase.findMany({
      include: {
        case: {
          select: {
            name: true,
            caseNumber: true,
            status: true
          }
        },
        respondent: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    console.log(`✅ Found ${respondentCases.length} respondent case assignments`);

    // Check case responses
    const caseResponses = await prisma.caseResponse.findMany({
      include: {
        case: {
          select: {
            name: true,
            caseNumber: true
          }
        }
      }
    });
    console.log(`✅ Found ${caseResponses.length} case responses`);

    // Check notifications
    const notifications = await prisma.caseNotification.findMany({
      where: {
        recipient: {
          role: 'RESPONDENT'
        }
      }
    });
    console.log(`✅ Found ${notifications.length} respondent notifications`);

    console.log('\n📊 Detailed breakdown:');
    
    respondentCases.forEach((rc, index) => {
      console.log(`\n${index + 1}. Case: ${rc.case.name} (${rc.case.caseNumber})`);
      console.log(`   Respondent: ${rc.respondent.name} (${rc.respondent.email})`);
      console.log(`   Status: ${rc.responseStatus}`);
      console.log(`   Phase: ${rc.currentPhase}`);
      console.log(`   Deadline: ${rc.responseDeadline ? rc.responseDeadline.toLocaleDateString() : 'Not set'}`);
    });

    return {
      respondentUsers: respondentUsers.length,
      respondentCases: respondentCases.length,
      caseResponses: caseResponses.length,
      notifications: notifications.length
    };

  } catch (error) {
    console.error('❌ Error verifying test data:', error);
    throw error;
  }
}

async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...');

    // Delete in reverse order due to foreign key constraints
    await prisma.caseNotification.deleteMany({
      where: {
        recipient: {
          email: {
            in: ['test.claimant@example.com', 'test.respondent@example.com']
          }
        }
      }
    });

    await prisma.caseResponse.deleteMany({
      where: {
        respondent: {
          email: {
            in: ['test.respondent@example.com']
          }
        }
      }
    });

    await prisma.respondentCase.deleteMany({
      where: {
        respondent: {
          email: 'test.respondent@example.com'
        }
      }
    });

    await prisma.arbitration.deleteMany({
      where: {
        user: {
          email: 'test.claimant@example.com'
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.claimant@example.com', 'test.respondent@example.com']
        }
      }
    });

    console.log('✅ Test data cleaned up successfully');

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  }
}

async function testRespondentAPI() {
  try {
    console.log('\n🔌 Testing Respondent API endpoints...');

    // This would require actual HTTP requests in a real scenario
    // For now, we'll just verify the database structure supports the API

    const respondent = await prisma.user.findUnique({
      where: { email: 'test.respondent@example.com' },
      include: {
        respondentCases: {
          include: {
            case: true
          }
        },
        caseResponses: true,
        receivedNotifications: true
      }
    });

    if (respondent) {
      console.log('✅ Respondent user found with related data');
      console.log(`   - Cases: ${respondent.respondentCases.length}`);
      console.log(`   - Responses: ${respondent.caseResponses.length}`);
      console.log(`   - Notifications: ${respondent.receivedNotifications.length}`);
    } else {
      console.log('❌ Respondent user not found');
    }

  } catch (error) {
    console.error('❌ Error testing API structure:', error);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'create':
        await createTestData();
        break;
      case 'verify':
        await verifyTestData();
        break;
      case 'cleanup':
        await cleanupTestData();
        break;
      case 'test-api':
        await testRespondentAPI();
        break;
      case 'full-test':
        await createTestData();
        await verifyTestData();
        await testRespondentAPI();
        break;
      default:
        console.log('📖 Usage:');
        console.log('  node scripts/test-respondent-functionality.js create     - Create test data');
        console.log('  node scripts/test-respondent-functionality.js verify     - Verify existing test data');
        console.log('  node scripts/test-respondent-functionality.js cleanup    - Remove test data');
        console.log('  node scripts/test-respondent-functionality.js test-api   - Test API structure');
        console.log('  node scripts/test-respondent-functionality.js full-test  - Run complete test suite');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 