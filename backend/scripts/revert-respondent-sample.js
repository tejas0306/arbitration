/*
  Revert helper: remove sample fields we added earlier for a specific case.
  Usage: node backend/scripts/revert-respondent-sample.js ADDS/ARB/2025/0000126
*/

const { PrismaClient } = require('@prisma/client');

async function main() {
  const caseNumber = process.argv[2];
  if (!caseNumber) {
    console.error('Provide caseNumber. Example: node backend/scripts/revert-respondent-sample.js ADDS/ARB/2025/0000126');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.arbitration.findFirst({ where: { caseNumber } });
    if (!existing) {
      console.error('Case not found for caseNumber:', caseNumber);
      process.exit(1);
    }

    // Remove step-based additions from formData if present, keep other keys intact
    const fd = { ...(existing.formData || {}) };
    delete fd.step2;
    delete fd.step5;
    delete fd.step6;
    delete fd.step7;
    delete fd.step10;

    const updated = await prisma.arbitration.update({
      where: { id: existing.id },
      data: {
        formData: fd,
        managerDetails: null,
        disputeDetails: {},
        natureOfDispute: null,
        disputeDescription: null,
        prayers: null,
        arguments: null,
      },
    });

    console.log('Reverted case to original-like state:', {
      id: updated.id,
      caseNumber: updated.caseNumber,
      managerDetailsType: typeof updated.managerDetails,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


