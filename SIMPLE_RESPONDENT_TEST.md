# Simple Respondent Testing Guide

## Quick Start Testing

Since there are some schema inconsistencies, here's a simple manual testing approach:

### 1. Start the Applications

```bash
# Terminal 1: Start Frontend
npm run dev

# Terminal 2: Start Backend (if separate)
cd backend
npm run start:dev
```

### 2. Create Test Users Manually

#### Option A: Using Registration UI
1. Navigate to `http://localhost:3000/auth/register`
2. Create a respondent user:
   - Name: "Jane Respondent"
   - Email: "jane@respondent.com"
   - Password: "password123"
   - Role: "RESPONDENT"
   - Organization: "Test Company"

#### Option B: Using Database Direct (if needed)
```sql
-- Connect to your database and run:
INSERT INTO "User" (id, email, password, name, role, organization, "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'jane@respondent.com',
  'password123',
  'Jane Respondent',
  'RESPONDENT',
  'Test Company',
  NOW(),
  NOW()
);
```

### 3. Test Respondent Dashboard Access

1. **Login as Respondent**
   - Go to `http://localhost:3000/auth/login`
   - Login with: `jane@respondent.com` / `password123`

2. **Access Dashboard**
   - Navigate to `http://localhost:3000/respondent/dashboard`
   - You should see the respondent dashboard

3. **Check Dashboard Elements**
   - [ ] Dashboard loads without errors
   - [ ] User welcome message displays
   - [ ] Statistics cards show (even if 0)
   - [ ] Cases section is visible
   - [ ] Notifications section is visible

### 4. Test API Endpoints

Open browser developer tools and test these endpoints:

```javascript
// Test dashboard API
fetch('/api/respondent/dashboard')
  .then(response => response.json())
  .then(data => console.log('Dashboard data:', data));

// Test cases API
fetch('/api/respondent/cases')
  .then(response => response.json())
  .then(data => console.log('Cases data:', data));

// Test notifications API
fetch('/api/respondent/notifications')
  .then(response => response.json())
  .then(data => console.log('Notifications data:', data));
```

### 5. Test Error Handling

1. **Access Control**
   - Logout and try accessing `/respondent/dashboard`
   - Should redirect to login

2. **Non-Respondent Access**
   - Login as a different role user
   - Try accessing `/respondent/dashboard`
   - Should show access denied

### 6. Test Case Detail Pages

If you have existing arbitration cases:

1. **Find Case ID**
   - Check your database for existing cases
   - Or create a case as a claimant user

2. **Access Case Detail**
   - Navigate to `/respondent/case/[case-id]`
   - Should show case details or appropriate error

### 7. Visual Testing Checklist

- [ ] **Dashboard Layout**
  - [ ] Header with user info
  - [ ] Navigation elements
  - [ ] Statistics cards
  - [ ] Cases list/table
  - [ ] Notifications panel

- [ ] **Responsive Design**
  - [ ] Mobile view works
  - [ ] Tablet view works
  - [ ] Desktop view works

- [ ] **Loading States**
  - [ ] Loading indicators show
  - [ ] Error states display properly
  - [ ] Empty states are handled

### 8. Browser Console Checks

1. **No JavaScript Errors**
   - Check browser console for errors
   - All API calls should complete

2. **Network Tab**
   - API calls return appropriate status codes
   - Response data is properly formatted

### 9. Authentication Flow

1. **Session Management**
   - [ ] Login works
   - [ ] Logout works
   - [ ] Session persists on refresh
   - [ ] Session expires appropriately

2. **Role-Based Access**
   - [ ] Respondent users can access respondent pages
   - [ ] Non-respondent users cannot access respondent pages
   - [ ] Proper error messages for unauthorized access

### 10. Integration Testing

If you have a complete workflow:

1. **Create Case as Claimant**
   - Login as claimant
   - Create arbitration case
   - Include respondent information

2. **Respond as Respondent**
   - Login as respondent
   - Check if case appears in dashboard
   - View case details
   - Submit response (if form is available)

### Expected Results

✅ **Working Correctly:**
- Respondent dashboard loads
- API endpoints return data (even if empty)
- Authentication works
- Role-based access control works
- UI components render properly

❌ **Common Issues:**
- Database schema mismatches
- API endpoint not found (404)
- Authentication failures
- UI components not rendering

### Troubleshooting

1. **Dashboard Not Loading**
   - Check if user role is set to 'RESPONDENT'
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **API Errors**
   - Verify backend is running
   - Check API route definitions
   - Ensure database connection works

3. **Authentication Issues**
   - Check NextAuth configuration
   - Verify session management
   - Check role assignments

### Quick Database Queries

If you need to check data:

```sql
-- Check users
SELECT id, name, email, role FROM "User" WHERE role = 'RESPONDENT';

-- Check if respondent tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('RespondentCase', 'CaseResponse', 'CaseNotification');

-- Check for any existing respondent data
SELECT COUNT(*) FROM "RespondentCase";
SELECT COUNT(*) FROM "CaseResponse";
```

### Success Criteria

The respondent functionality is working if:

1. ✅ Respondent users can login and access dashboard
2. ✅ Dashboard displays without errors
3. ✅ API endpoints respond (even with empty data)
4. ✅ Authentication and authorization work
5. ✅ UI components render properly
6. ✅ Error handling works appropriately

### Next Steps

Once basic functionality is confirmed:
1. Create test cases with actual data
2. Test response submission
3. Test notifications
4. Test integration with claimant workflow
5. Performance testing
6. User acceptance testing

---

**Note:** This guide focuses on testing the core respondent functionality without complex database setup. Once the basic features are working, you can gradually add more test data and scenarios. 