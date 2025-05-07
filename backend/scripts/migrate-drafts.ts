import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateDrafts() {
  console.log('Starting draft migration script...');
  
  // Create a database connection
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'arbitration',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  console.log('Connected to database successfully');

  try {
    // Check for drafts with missing caseNumber
    const arbitrationRepo = connection.getRepository('arbitration_cases');
    
    // Find all drafts
    const drafts = await arbitrationRepo.find({
      where: { status: 'DRAFT' },
    });
    
    console.log(`Found ${drafts.length} drafts in the database`);
    
    // Update any drafts without a caseNumber (only for testing)
    let updatedCount = 0;
    for (const draft of drafts) {
      if (!draft.caseNumber) {
        // Generate a unique case number
        draft.caseNumber = `ARB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await arbitrationRepo.save(draft);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} drafts with case numbers`);
    
    // Verify that endpoint URLs are set correctly
    console.log('Testing endpoint URLs:');
    console.log(`- GET drafts URL: ${process.env.API_URL}/api/arbitration/drafts`);
    console.log(`- Submit draft URL: ${process.env.API_URL}/api/arbitration/drafts/{id}/submit`);
    
    console.log('Migration script completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the connection
    await connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration function
migrateDrafts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 