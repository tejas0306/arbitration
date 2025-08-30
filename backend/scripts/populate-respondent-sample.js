/*
  One-off helper to populate missing respondent-facing fields for a specific case.
  Usage: node backend/scripts/populate-respondent-sample.js ADDS/ARB/2025/0000126
*/

const { PrismaClient } = require('@prisma/client');

async function main() {
  const caseNumber = process.argv[2];
  if (!caseNumber) {
    console.error('Provide caseNumber. Example: node backend/scripts/populate-respondent-sample.js ADDS/ARB/2025/0000126');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.arbitration.findFirst({ where: { caseNumber } });
    if (!existing) {
      console.error('Case not found for caseNumber:', caseNumber);
      process.exit(1);
    }

    const sampleManager = {
      name: 'Manager One',
      email: 'manager@example.com',
      phone: '+91-9876543210',
      designation: 'Legal Manager',
      address: '123 Corporate Park, Mumbai',
    };

    const sampleNature = [
      {
        category: 'Contract',
        subCategory: 'Breach of Contract',
        natureOfDispute: 'Delay in delivery and payment default',
        dateWhenRightToClaimArose: '2024-08-01',
        standardisedPrayerClauses: ['Injunction', 'Damages']
      }
    ];

    const sampleDescriptions = [
      {
        clause: '4.2',
        claimType: 'Monetary',
        claimReason: 'Non-payment for delivered goods',
        reliefSought: 'INR 5,00,000 plus interest',
      }
    ];

    const samplePrayers = ['Award principal amount', 'Award interest @ 12% p.a.', 'Costs of arbitration'];
    const sampleArguments = [
      { issue: 'Liability', arguments: ['Breach admitted by emails', 'Delivered per PO terms'] },
      { issue: 'Quantum', arguments: ['Invoices acknowledged', 'No valid set-off raised'] },
    ];

    // Update flattened string fields as JSON strings for robustness
    const updateData = {
      managerDetails: sampleManager,
      disputeDetails: {
        natureOfDispute: sampleNature,
        disputeDescriptions: sampleDescriptions,
      },
      formData: {
        ...(existing.formData || {}),
        step2: { managerDetails: sampleManager },
        step5: { natureOfDispute: sampleNature },
        step6: { disputeDescriptions: sampleDescriptions },
        step7: { prayers: { prayers: samplePrayers } },
        step10: { arguments: { argumentsPerIssue: sampleArguments } },
        documents: existing.formData?.documents || existing.documents || {},
      },
      natureOfDispute: JSON.stringify(sampleNature),
      disputeDescription: JSON.stringify(sampleDescriptions),
      prayers: JSON.stringify(samplePrayers),
      arguments: JSON.stringify(sampleArguments),
    };

    const updated = await prisma.arbitration.update({
      where: { id: existing.id },
      data: updateData,
    });

    console.log('Updated case:', {
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


