import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Store sequence in a JSON file to persist between restarts
const SEQUENCE_FILE = path.join(process.cwd(), 'data', 'case-sequence.json');

// Function to generate the next case ID with a sequential number
async function generateCaseId(): Promise<string> {
  try {
    // Make sure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read the current sequence number, or initialize if it doesn't exist
    let sequence = 1;
    if (fs.existsSync(SEQUENCE_FILE)) {
      const data = fs.readFileSync(SEQUENCE_FILE, 'utf8');
      const json = JSON.parse(data);
      sequence = json.sequence || 1;
    }
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Format the case ID: ADDS/ARB/{Year}/{Seven Digit Running Number}
    const caseId = `ADDS/ARB/${currentYear}/${String(sequence).padStart(7, '0')}`;
    
    // Update the sequence number for the next case
    fs.writeFileSync(SEQUENCE_FILE, JSON.stringify({ sequence: sequence + 1 }));
    
    return caseId;
  } catch (error) {
    console.error('Error generating case ID:', error);
    throw error;
  }
}

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
        draft.caseNumber = await generateCaseId();
        await arbitrationRepo.save(draft);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} drafts with case numbers`);
    
    // Verify that endpoint URLs are set correctly
    console.log('Testing endpoint URLs:');
    console.log(`- GET drafts URL: ${process.env.API_URL}/api/arbitration/drafts`);
    console.log(`- Submit draft URL: ${process.env.API_URL}/api/arbitration/draft/{id}/submit`);
    
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