const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check User table
    const user = await prisma.user.findFirst();
    if (user) {
      console.log('User table exists. Sample user fields:', Object.keys(user));
      console.log('Sample user:', JSON.stringify(user, null, 2));
    } else {
      console.log('No users found in database');
    }
    
    // Check if respondent tables exist
    try {
      const respondentCase = await prisma.respondentCase.findFirst();
      console.log('RespondentCase table exists');
      if (respondentCase) {
        console.log('Sample respondent case fields:', Object.keys(respondentCase));
      }
    } catch (error) {
      console.log('RespondentCase table does not exist:', error.message);
    }
    
    try {
      const caseNotification = await prisma.caseNotification.findFirst();
      console.log('CaseNotification table exists');
      if (caseNotification) {
        console.log('Sample case notification fields:', Object.keys(caseNotification));
      }
    } catch (error) {
      console.log('CaseNotification table does not exist:', error.message);
    }
    
    try {
      const caseResponse = await prisma.caseResponse.findFirst();
      console.log('CaseResponse table exists');
      if (caseResponse) {
        console.log('Sample case response fields:', Object.keys(caseResponse));
      }
    } catch (error) {
      console.log('CaseResponse table does not exist:', error.message);
    }
    
    // Check Arbitration table
    try {
      const arbitration = await prisma.arbitration.findFirst();
      console.log('Arbitration table exists');
      if (arbitration) {
        console.log('Sample arbitration fields:', Object.keys(arbitration));
      }
    } catch (error) {
      console.log('Arbitration table does not exist:', error.message);
    }
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema(); 