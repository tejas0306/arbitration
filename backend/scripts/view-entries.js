// Script to view arbitration entries
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all arbitration entries, ordered by most recent first
    const entries = await prisma.arbitration.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${entries.length} arbitration entries:\n`);

    // Print each entry in a readable format
    entries.forEach((entry, index) => {
      console.log(`==== Entry ${index + 1} ====`);
      console.log(`ID: ${entry.id}`);
      console.log(`Case Number: ${entry.caseNumber}`);
      console.log(`Type: ${entry.type}`);
      console.log(`Name: ${entry.name}`);
      console.log(`Email: ${entry.email}`);
      console.log(`Status: ${entry.status}`);
      console.log(`Created: ${entry.createdAt}`);
      console.log(`Documents:`, JSON.stringify(entry.documents, null, 2));
      console.log('\n');
    });
  } catch (error) {
    console.error('Error viewing entries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 