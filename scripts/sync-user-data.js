const { PrismaClient } = require('@prisma/client');

// Frontend database (root directory)
const frontendPrisma = new PrismaClient();

// Backend database (backend directory)
const backendPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.BACKEND_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function syncUserData() {
  try {
    console.log('Syncing user data between frontend and backend databases...');
    
    // Get the respondent user from backend
    const backendRespondent = await backendPrisma.user.findFirst({
      where: { role: 'RESPONDENT' }
    });
    
    if (!backendRespondent) {
      console.log('No respondent user found in backend database');
      return;
    }
    
    console.log('Found backend respondent:', backendRespondent.email);
    
    // Check if user exists in frontend database
    const frontendUser = await frontendPrisma.user.findUnique({
      where: { email: backendRespondent.email }
    });
    
    if (frontendUser) {
      console.log('User already exists in frontend database');
      // Update the user ID to match backend
      if (frontendUser.id !== backendRespondent.id) {
        console.log('Updating user ID to match backend...');
        await frontendPrisma.user.update({
          where: { id: frontendUser.id },
          data: { 
            id: backendRespondent.id,
            name: backendRespondent.name,
            role: backendRespondent.role,
            organization: backendRespondent.organization,
            mobile: backendRespondent.mobile
          }
        });
        console.log('User updated successfully');
      }
    } else {
      console.log('Creating user in frontend database...');
      await frontendPrisma.user.create({
        data: {
          id: backendRespondent.id,
          email: backendRespondent.email,
          name: backendRespondent.name,
          role: backendRespondent.role,
          organization: backendRespondent.organization,
          mobile: backendRespondent.mobile
        }
      });
      console.log('User created successfully');
    }
    
    console.log('User data sync completed!');
    
  } catch (error) {
    console.error('Error syncing user data:', error);
  } finally {
    await frontendPrisma.$disconnect();
    await backendPrisma.$disconnect();
  }
}

syncUserData(); 