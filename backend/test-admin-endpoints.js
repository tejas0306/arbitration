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

    // Step 1: Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testAdmin.email,
      password: testAdmin.password
    });
    
    const token = loginResponse.data.access_token;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test user creation
    try {
      const createResponse = await axios.post(`${BASE_URL}/admin/users/create`, testUser, { headers });
      
      const userId = createResponse.data.id;

      // Step 3: Test getting all users
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`, { headers });

      // Step 4: Test getting user details
      const userDetailsResponse = await axios.get(`${BASE_URL}/admin/users/${userId}`, { headers });

      // Step 5: Test password reset
      const resetResponse = await axios.post(`${BASE_URL}/admin/users/${userId}/reset-password`, {
        reason: 'Testing password reset functionality',
        sendEmail: false
      }, { headers });

      // Step 6: Test user role update
      const roleUpdateResponse = await axios.patch(`${BASE_URL}/admin/users/${userId}/role`, {
        role: 'TEAM_MEMBER',
        notes: 'Updated role for testing'
      }, { headers });

      // Step 7: Test user suspension
      const suspendResponse = await axios.post(`${BASE_URL}/admin/users/${userId}/suspend`, {
        reason: 'Testing suspension functionality',
        duration: 7 // 7 days
      }, { headers });

      // Step 8: Test user activation
      const activateResponse = await axios.post(`${BASE_URL}/admin/users/${userId}/activate`, {}, { headers });


    } catch (createError) {
      if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
      } else {
        throw createError;
      }
    }

  } catch (error) {
    
    if (error.response?.status === 401) {
    }
  }
}

// Run the tests
testAdminEndpoints(); 