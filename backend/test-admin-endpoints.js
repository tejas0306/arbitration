const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testAdmin = {
  email: 'test-admin@example.com',
  password: 'TestPassword123!'
};

const testUser = {
  name: 'Test Case Manager',
  email: 'test-cm@example.com',
  password: 'TestPassword123!',
  role: 'CASE_MANAGER',
  organization: 'Test Organization',
  sendCredentials: false
};

async function testAdminEndpoints() {
  try {
    console.log('🧪 Testing Admin User Management Endpoints...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testAdmin.email,
      password: testAdmin.password
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Admin login successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test user creation
    console.log('2. Creating internal user...');
    try {
      const createResponse = await axios.post(`${BASE_URL}/admin/users/create`, testUser, { headers });
      console.log('✅ User created successfully:', createResponse.data.email);
      console.log('   Role:', createResponse.data.role);
      console.log('   Organization:', createResponse.data.organization);
      
      const userId = createResponse.data.id;

      // Step 3: Test getting all users
      console.log('\n3. Fetching all users...');
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`, { headers });
      console.log('✅ Users fetched successfully. Total users:', usersResponse.data.length);

      // Step 4: Test getting user details
      console.log('\n4. Fetching user details...');
      const userDetailsResponse = await axios.get(`${BASE_URL}/admin/users/${userId}`, { headers });
      console.log('✅ User details fetched:', userDetailsResponse.data.name);

      // Step 5: Test password reset
      console.log('\n5. Testing password reset...');
      const resetResponse = await axios.post(`${BASE_URL}/admin/users/${userId}/reset-password`, {
        reason: 'Testing password reset functionality',
        sendEmail: false
      }, { headers });
      console.log('✅ Password reset successful');
      console.log('   New temporary password:', resetResponse.data.temporaryPassword);

      // Step 6: Test user role update
      console.log('\n6. Testing role update...');
      const roleUpdateResponse = await axios.patch(`${BASE_URL}/admin/users/${userId}/role`, {
        role: 'TEAM_MEMBER',
        notes: 'Updated role for testing'
      }, { headers });
      console.log('✅ Role updated successfully to:', roleUpdateResponse.data.role);

      // Step 7: Test user suspension
      console.log('\n7. Testing user suspension...');
      const suspendResponse = await axios.post(`${BASE_URL}/admin/users/${userId}/suspend`, {
        reason: 'Testing suspension functionality',
        duration: 7 // 7 days
      }, { headers });
      console.log('✅ User suspended successfully');

      // Step 8: Test user activation
      console.log('\n8. Testing user activation...');
      const activateResponse = await axios.post(`${BASE_URL}/admin/users/${userId}/activate`, {}, { headers });
      console.log('✅ User activated successfully');

      console.log('\n🎉 All admin user management endpoints working correctly!');

    } catch (createError) {
      if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  User already exists, skipping creation test');
      } else {
        throw createError;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure you have an admin user with credentials:');
      console.log(`   Email: ${testAdmin.email}`);
      console.log(`   Password: ${testAdmin.password}`);
      console.log('\n   You can create one using the create-test-users script.');
    }
  }
}

// Run the tests
testAdminEndpoints(); 