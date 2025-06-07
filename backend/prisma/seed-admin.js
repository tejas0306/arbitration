const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting admin user creation...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@arbitration.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin@arbitration.com', 10);
      
      // Update the admin user
      await prisma.user.update({
        where: { email: 'admin@arbitration.com' },
        data: { 
          password: hashedPassword,
          status: 'ACTIVE',
          isActive: true
        }
      });
      
      console.log('Admin user password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin@arbitration.com', 10);
      
      // Create the admin user
      await prisma.user.create({
        data: {
          email: 'admin@arbitration.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          status: 'ACTIVE',
          isActive: true
        }
      });
      
      console.log('Admin user created successfully!');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
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