const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createRespondentTestData() {
  try {
    console.log('Creating respondent test data...');
    
    // Get the existing respondent user
    const respondentUser = await prisma.user.findFirst({
      where: { role: 'RESPONDENT' }
    });
    
    if (!respondentUser) {
      console.log('No respondent user found. Creating one...');
      const newRespondent = await prisma.user.create({
        data: {
          email: 'respondent@test.com',
          name: 'Test Respondent',
          role: 'RESPONDENT',
          mobile: '+1234567890'
        }
      });
      console.log('Created respondent user:', newRespondent.email);
    } else {
      console.log('Found respondent user:', respondentUser.email);
    }
    
    // Create a test case
    let testCase = await prisma.arbitration.findFirst({
      where: { title: 'Test Case for Respondent' }
    });
    
    if (!testCase) {
      // Get or create a claimant user
      let claimantUser = await prisma.user.findFirst({
        where: { role: 'CLAIMANT' }
      });
      
      if (!claimantUser) {
        claimantUser = await prisma.user.create({
          data: {
            email: 'claimant@test.com',
            name: 'Test Claimant',
            role: 'CLAIMANT'
          }
        });
      }
      
      testCase = await prisma.arbitration.create({
        data: {
          title: 'Test Case for Respondent',
          caseNumber: 'ARB-2025-TEST-001',
          type: 'COMMERCIAL',
          status: 'PENDING',
          disputeDetails: 'Test dispute for respondent functionality',
          userId: claimantUser.id
        }
      });
      console.log('Created test case:', testCase.caseNumber);
    } else {
      console.log('Found test case:', testCase.caseNumber);
    }
    
    // Check if respondent tables exist and create test data
    try {
      // Try to create a respondent case
      const existingRespondentCase = await prisma.respondentCase.findFirst({
        where: {
          respondentId: respondentUser.id,
          caseId: testCase.id
        }
      });
      
      if (!existingRespondentCase) {
        const respondentCase = await prisma.respondentCase.create({
          data: {
            respondentId: respondentUser.id,
            caseId: testCase.id,
            responseStatus: 'PENDING',
            currentPhase: 'NOTICE_SERVED',
            responseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            noticeServedAt: new Date(),
            noticeAttempts: 1
          }
        });
        console.log('Created respondent case:', respondentCase.id);
      } else {
        console.log('Respondent case already exists');
      }
      
      // Create a test notification
      const existingNotification = await prisma.caseNotification.findFirst({
        where: {
          recipientId: respondentUser.id,
          caseId: testCase.id
        }
      });
      
      if (!existingNotification) {
        const notification = await prisma.caseNotification.create({
          data: {
            recipientId: respondentUser.id,
            recipientType: 'RESPONDENT',
            caseId: testCase.id,
            type: 'CASE_ASSIGNMENT',
            title: 'New Case Assignment',
            message: `You have been assigned to respond to case ${testCase.caseNumber}`,
            isRead: false
          }
        });
        console.log('Created notification:', notification.id);
      } else {
        console.log('Notification already exists');
      }
      
    } catch (error) {
      console.log('Respondent tables might not exist yet. Error:', error.message);
      console.log('You may need to run database migrations first.');
    }
    
    console.log('Test data creation completed!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRespondentTestData(); 