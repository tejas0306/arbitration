const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createRespondentUser() {
  try {
    // Create the respondent user that exists in the backend
    const respondentUser = await prisma.user.create({
      data: {
        id: 'f497a4b7-87a9-46fb-805e-954b47a68f35',
        email: 'kyhileso@mailinator.com',
        password: '$2b$10$pSuu0wNV7Sl8FPd24D8q0eJVcTWub2Gah2YRKRTmOQhTC3wJS9MYO', // From backend
        name: 'Denton Herrera',
        role: 'RESPONDENT',
        organization: 'Marsh and Jensen Traders',
        phone: null
      }
    });
    
    console.log('Created respondent user:', respondentUser.email);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists');
    } else {
      console.log('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createRespondentUser(); 