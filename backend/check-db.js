const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking backend database...');
    
    const users = await prisma.user.findMany();
    console.log('Users in backend database:', users.length);
    
    if (users.length > 0) {
      console.log('Sample user:', users[0]);
    }
    
    const respondentUsers = await prisma.user.findMany({
      where: { role: 'RESPONDENT' }
    });
    console.log('Respondent users:', respondentUsers.length);
    
    if (respondentUsers.length > 0) {
      console.log('Respondent user:', respondentUsers[0]);
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 