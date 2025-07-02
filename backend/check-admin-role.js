const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {

    // Check the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@arbitration.com' }
    });

    if (!adminUser) {
      return;
    }

- Email: ${adminUser.email}
- Name: ${adminUser.name}
- Role: ${adminUser.role}
- Status: ${adminUser.status}
- isActive: ${adminUser.isActive}
`);

    // Update to ADMIN role if needed
    if (adminUser.role !== 'ADMIN') {
      
      // Update the admin user
      await prisma.user.update({
        where: { email: 'admin@arbitration.com' },
        data: { 
          role: 'ADMIN',
          status: 'ACTIVE',
          isActive: true
        }
      });
      
      
      // Verify the update
      const updatedUser = await prisma.user.findUnique({
        where: { email: 'admin@arbitration.com' }
      });
      
- Email: ${updatedUser.email}
- Name: ${updatedUser.name}
- Role: ${updatedUser.role}
- Status: ${updatedUser.status}
- isActive: ${updatedUser.isActive}
`);
    } else {
    }
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 