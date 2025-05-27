import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔧 Creating test users for role testing...');

  const defaultPassword = 'Test123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const testUsers = [
    // Claimant User
    {
      email: 'claimant@test.com',
      password: hashedPassword,
      name: 'John Claimant',
      role: 'CLAIMANT',
      organization: 'ABC Corp',
    },
    // Respondent User
    {
      email: 'respondent@test.com',
      password: hashedPassword,
      name: 'Jane Respondent',
      role: 'RESPONDENT',
      organization: 'XYZ Ltd',
    },
    // Arbitrator User
    {
      email: 'arbitrator@test.com',
      password: hashedPassword,
      name: 'Dr. Michael Arbitrator',
      role: 'ARBITRATOR',
      organization: 'Arbitration Institute',
      expertise: 'Commercial Law, Contract Disputes',
      qualifications: 'LLM, PhD in Law, 15 years experience',
      experience: 15,
      bio: 'Experienced arbitrator specializing in commercial disputes',
      languages: ['English', 'Spanish', 'French'],
      location: 'New York, USA',
      hourlyRate: 500,
      arbitratorStatus: 'ACTIVE',
    },
    // Admin User
    {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Sarah Admin',
      role: 'ADMIN',
      organization: 'Arbitration Portal Admin',
    },
    // Case Manager User
    {
      email: 'manager@test.com',
      password: hashedPassword,
      name: 'David Manager',
      role: 'CASE_MANAGER',
      organization: 'Case Management Team',
      managedCases: [],
      teamMembers: [],
    },
    // Team Member User
    {
      email: 'team@test.com',
      password: hashedPassword,
      name: 'Lisa TeamMember',
      role: 'TEAM_MEMBER',
      organization: 'Support Team',
    },
  ];

  try {
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await prisma.user.create({
        data: userData as any,
      });

      console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.email})`);
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\nLogin credentials for testing:');
    console.log('==================================');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${defaultPassword}`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers().catch(console.error); 