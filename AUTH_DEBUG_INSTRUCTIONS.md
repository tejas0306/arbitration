# Authentication Debug Instructions

## Issue: Dashboard still showing all data instead of user-specific data

## Step 1: Test Authentication Headers

1. **Login to your application**
2. **Open browser Developer Tools (F12)**
3. **Go to Console tab**
4. **Run this JavaScript code**:

```javascript
// Test if authentication headers are working
async function testAuth() {
  try {
    const response = await fetch('/api/debug/auth-test');
    const data = await response.json();
    console.log('Auth Test Result:', data);
    
    if (data.success) {
      console.log('✅ Authentication headers are working');
      console.log('Token length:', data.tokenLength);
    } else {
      console.log('❌ Authentication headers missing');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('Auth test failed:', error);
  }
}

testAuth();
```

## Step 2: Test Cases API Directly

```javascript
// Test the cases API directly
async function testCasesAPI() {
  try {
    console.log('Testing /api/arbitration/cases...');
    const response = await fetch('/api/arbitration/cases');
    const data = await response.json();
    
    console.log('Cases API Response:', {
      status: response.status,
      dataLength: Array.isArray(data) ? data.length : 'Not an array',
      data: data
    });
    
    if (response.status === 401) {
      console.log('❌ Authentication failed on cases API');
    } else if (Array.isArray(data)) {
      console.log(`📊 API returned ${data.length} cases`);
      if (data.length === 0) {
        console.log('✅ Empty result (this is expected for new users)');
      } else {
        console.log('⚠️ Non-empty result (investigate if these should be user-specific)');
      }
    }
  } catch (error) {
    console.error('Cases API test failed:', error);
  }
}

testCasesAPI();
```

## Step 3: Check Network Tab

1. **Refresh the dashboard page**
2. **Open Network tab in DevTools**
3. **Look for requests to `/api/arbitration/cases`**
4. **Check the request headers**:
   - Should have `Authorization: Bearer <token>`
   - Should NOT be a request to `localhost:3001` directly

## Step 4: Check Server Console

If you're running the dev server, check the terminal for these logs:
- `🔄 API Proxy - Cases endpoint called: GET`
- `🔄 Auth header present: true`
- `🔄 Backend returned X cases for authenticated user`

## Expected Results

### For New User (Empty Dashboard)
- Auth test: ✅ Success
- Cases API: Returns empty array `[]`
- Network: Shows Authorization header

### For User With Data
- Auth test: ✅ Success  
- Cases API: Returns only user's cases
- Network: Shows Authorization header

## If Still Failing

### Check 1: Local Storage
```javascript
// Check if token exists
console.log('Auth token:', localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING');
console.log('User data:', localStorage.getItem('user'));
```

### Check 2: Clear Data and Re-login
1. Open DevTools → Application tab
2. Clear localStorage
3. Logout and login again
4. Re-test

### Check 3: Backend Connection
```javascript
// Test if backend is reachable
async function testBackend() {
  try {
    const response = await fetch('/api/debug/auth-test');
    console.log('API route working:', response.status === 200);
  } catch (error) {
    console.error('API route failed:', error);
  }
}

testBackend();
```

## Next Steps

Based on the test results:
- If auth headers are missing → Frontend token issue
- If auth headers present but still showing all data → Backend filtering issue
- If API returns 401 → Authentication setup problem
- If API returns 500 → Backend connection problem 