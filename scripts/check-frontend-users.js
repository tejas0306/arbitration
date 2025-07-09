const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFrontendUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'RESPONDENT' }
    });
    
    console.log('Respondent users in frontend DB:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}, Name: ${user.name})`);
    });
    
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFrontendUsers(); 