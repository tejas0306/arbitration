/*
  Non-destructive dump of an arbitration case to inspect real stored JSON.
  Usage:
    node backend/scripts/dump-arbitration-case.js --id <uuid>
    node backend/scripts/dump-arbitration-case.js --case <caseNumber>
*/

const { PrismaClient } = require('@prisma/client');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const k = args[i];
    const v = args[i + 1];
    if (!k || !v) continue;
    if (k === '--id') out.id = v;
    if (k === '--case') out.caseNumber = v;
  }
  return out;
}

async function main() {
  const prisma = new PrismaClient();
  const { id, caseNumber } = parseArgs();
  if (!id && !caseNumber) {
    console.error('Provide --id <uuid> or --case <caseNumber>');
    process.exit(1);
  }
  try {
    const where = id ? { id } : { caseNumber };
    const row = await prisma.arbitration.findFirst({ where });
    if (!row) {
      console.error('Case not found for', where);
      process.exit(1);
    }
    const pick = (o) => (o == null ? null : o);
    const dump = {
      id: row.id,
      caseNumber: row.caseNumber,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      flattened: {
        natureOfDispute: pick(row.natureOfDispute),
        disputeDescription: pick(row.disputeDescription),
        arguments: pick(row.arguments),
        prayers: pick(row.prayers),
        paymentAmount: pick(row.paymentAmount),
        paymentDetails: pick(row.paymentDetails),
      },
      jsonKeys: {
        formData: row.formData ? Object.keys(row.formData) : [],
        disputeDetails: row.disputeDetails ? Object.keys(row.disputeDetails) : [],
        managerDetails: row.managerDetails ? Object.keys(row.managerDetails) : [],
        documents: row.documents ? Object.keys(row.documents) : [],
      },
      snippets: {
        formData: row.formData ?? null,
        disputeDetails: row.disputeDetails ?? null,
        managerDetails: row.managerDetails ?? null,
        documents: row.documents ?? null,
      },
    };
    console.log(JSON.stringify(dump, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


