const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCase() {
  try {
    const caseId = '69effe01-f04f-4583-a0a0-4e30466740cf';
    
    console.log('Checking for case:', caseId);
    
    // Check by exact ID
    const byId = await prisma.arbitration.findUnique({
      where: { id: caseId }
    });
    console.log('Found by ID:', byId ? 'YES' : 'NO');
    
    // Check recent cases
    const recent = await prisma.arbitration.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        caseNumber: true,
        createdAt: true,
        status: true
      }
    });
    
    console.log('Recent cases:');
    recent.forEach(c => {
      console.log(`- ID: ${c.id}, Case#: ${c.caseNumber}, Status: ${c.status}, Created: ${c.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCase();
