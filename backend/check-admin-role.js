const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking admin user role...');

    // Check the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@arbitration.com' }
    });

    if (!adminUser) {
      console.log('Admin user not found!');
      return;
    }

    console.log(`Current user details:
- Email: ${adminUser.email}
- Name: ${adminUser.name}
- Role: ${adminUser.role}
- Status: ${adminUser.status}
- isActive: ${adminUser.isActive}
`);

    // Update to ADMIN role if needed
    if (adminUser.role !== 'ADMIN') {
      console.log('Updating user to ADMIN role...');
      
      // Update the admin user
      await prisma.user.update({
        where: { email: 'admin@arbitration.com' },
        data: { 
          role: 'ADMIN',
          status: 'ACTIVE',
          isActive: true
        }
      });
      
      console.log('Admin user role updated successfully!');
      
      // Verify the update
      const updatedUser = await prisma.user.findUnique({
        where: { email: 'admin@arbitration.com' }
      });
      
      console.log(`Updated user details:
- Email: ${updatedUser.email}
- Name: ${updatedUser.name}
- Role: ${updatedUser.role}
- Status: ${updatedUser.status}
- isActive: ${updatedUser.isActive}
`);
    } else {
      console.log('User already has ADMIN role.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 