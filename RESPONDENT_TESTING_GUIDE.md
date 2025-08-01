# Respondent Functionality Testing Guide

## Overview
This guide provides comprehensive testing instructions for the respondent functionality in the Legal AI Arbitration Portal.

## Prerequisites

### 1. Environment Setup
- Ensure both frontend and backend are running:
  ```bash
  # Terminal 1: Frontend
  npm run dev

  # Terminal 2: Backend
  cd backend
  npm run start:dev
  ```

### 2. Database Setup
- Ensure Prisma migrations are applied:
  ```bash
  npx prisma migrate dev
  npx prisma generate
  ```

### 3. Test Users
You'll need test users with different roles:
- **Claimant**: To create arbitration cases
- **Respondent**: To respond to cases
- **Admin**: To manage the system

## Testing Scenarios

### Scenario 1: User Registration and Role Assignment

#### Test Case 1.1: Create Respondent User
1. Navigate to `/auth/register`
2. Fill in the form with:
   - Name: "Jane Respondent"
   - Email: "jane.respondent@test.com"
   - Password: "password123"
   - Organization: "Test Company"
   - Role: "RESPONDENT"
3. Click "Register"
4. Verify registration success

#### Test Case 1.2: Respondent Login
1. Navigate to `/auth/login`
2. Login with respondent credentials
3. Verify redirect to appropriate dashboard

### Scenario 2: Case Creation and Respondent Assignment

#### Test Case 2.1: Create Case with Respondent
1. Login as a claimant user
2. Navigate to `/arbitration/new`
3. Fill out the arbitration form including:
   - Case details
   - **Respondent information** (name, email, organization)
   - Dispute details
   - Evidence/documents
4. Submit the case
5. Verify case creation and respondent assignment

#### Test Case 2.2: Verify Respondent Case Assignment
1. Check database for RespondentCase creation:
   ```sql
   SELECT * FROM RespondentCase WHERE respondentId = 'respondent-user-id';
   ```

### Scenario 3: Respondent Dashboard Testing

#### Test Case 3.1: Dashboard Access
1. Login as respondent user
2. Navigate to `/respondent/dashboard`
3. Verify dashboard displays:
   - User information
   - Case statistics (Total Cases, Pending Responses, etc.)
   - Recent cases list
   - Notifications
   - Action buttons

#### Test Case 3.2: Dashboard Data Accuracy
1. Verify statistics match actual data:
   - Total cases assigned to respondent
   - Pending responses count
   - Submitted responses count
   - Unread notifications count

### Scenario 4: Case Response Testing

#### Test Case 4.1: View Case Details
1. From respondent dashboard, click on a case
2. Navigate to `/respondent/case/[id]`
3. Verify case details display:
   - Case overview
   - Dispute details
   - Arbitration agreement
   - Documents/evidence
   - Response form (if applicable)

#### Test Case 4.2: Submit Case Response
1. On case detail page, click "Submit Response"
2. Fill out response form:
   - Response to allegations
   - Counter-claims (if any)
   - Supporting documents
   - Contact preferences
3. Submit response
4. Verify response is saved and status updated

#### Test Case 4.3: Response Status Updates
1. Verify response status changes from "PENDING" to "SUBMITTED"
2. Check database for CaseResponse record creation
3. Verify case phase updates appropriately

### Scenario 5: Notification System Testing

#### Test Case 5.1: Notification Creation
1. Trigger events that should create notifications:
   - Case assignment
   - Response deadline approaching
   - Arbitrator assignment
   - Hearing scheduled
2. Verify notifications are created in database

#### Test Case 5.2: Notification Display
1. Check `/respondent/dashboard` for notification display
2. Verify notification count in dashboard stats
3. Test notification read/unread functionality

#### Test Case 5.3: Email Notifications
1. Verify email notifications are sent for:
   - Case assignment
   - Response deadlines
   - Arbitrator proposals
   - Hearing notifications

### Scenario 6: API Endpoint Testing

#### Test Case 6.1: Respondent API Endpoints
Test all respondent API endpoints:

```bash
# Get dashboard data
curl -X GET http://localhost:3000/api/respondent/dashboard \
  -H "Authorization: Bearer <token>"

# Get respondent cases
curl -X GET http://localhost:3000/api/respondent/cases \
  -H "Authorization: Bearer <token>"

# Get specific case
curl -X GET http://localhost:3000/api/respondent/cases/[case-id] \
  -H "Authorization: Bearer <token>"

# Submit response
curl -X POST http://localhost:3000/api/respondent/cases/[case-id]/respond \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"response": "Test response", "documents": []}'

# Get notifications
curl -X GET http://localhost:3000/api/respondent/notifications \
  -H "Authorization: Bearer <token>"
```

### Scenario 7: Integration Testing

#### Test Case 7.1: End-to-End Workflow
1. **Claimant** creates case with respondent details
2. **System** automatically creates RespondentCase record
3. **Respondent** receives notification (email/in-app)
4. **Respondent** logs in and views dashboard
5. **Respondent** clicks on case and reviews details
6. **Respondent** submits response
7. **System** updates case status and notifies claimant
8. **Admin** can view case progress

#### Test Case 7.2: Multi-Respondent Cases
1. Create case with multiple respondents
2. Verify each respondent gets separate RespondentCase record
3. Test individual response submission
4. Verify case status updates appropriately

### Scenario 8: Error Handling and Edge Cases

#### Test Case 8.1: Access Control
1. Try accessing respondent pages as non-respondent user
2. Verify proper error messages and redirects
3. Test API endpoint authentication

#### Test Case 8.2: Invalid Data Handling
1. Submit invalid response data
2. Test with missing required fields
3. Verify proper error messages

#### Test Case 8.3: Deadline Handling
1. Test response after deadline
2. Verify overdue indicators
3. Test deadline extension scenarios

## Automated Testing

### Create Test Script
Create a test script to automate common scenarios:

```javascript
// test-respondent-workflow.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRespondentWorkflow() {
  try {
    // 1. Create test respondent user
    const respondent = await prisma.user.create({
      data: {
        email: 'test.respondent@example.com',
        name: 'Test Respondent',
        role: 'RESPONDENT',
        organization: 'Test Org'
      }
    });

    // 2. Create test case
    const arbitrationCase = await prisma.arbitration.create({
      data: {
        name: 'Test Case',
        type: 'COMMERCIAL',
        status: 'SUBMITTED',
        userId: 'claimant-user-id',
        disputeDetails: 'Test dispute'
      }
    });

    // 3. Create respondent case assignment
    const respondentCase = await prisma.respondentCase.create({
      data: {
        respondentId: respondent.id,
        caseId: arbitrationCase.id,
        responseStatus: 'PENDING',
        currentPhase: 'NOTICE_SERVED',
        noticeServedAt: new Date(),
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    console.log('✅ Test data created successfully');
    console.log('Respondent ID:', respondent.id);
    console.log('Case ID:', arbitrationCase.id);
    console.log('RespondentCase ID:', respondentCase.id);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRespondentWorkflow();
```

### Run Test Script
```bash
node test-respondent-workflow.js
```

## Performance Testing

### Load Testing
1. Create multiple respondent users
2. Assign multiple cases to each respondent
3. Test dashboard performance with large datasets
4. Monitor API response times

### Database Performance
1. Test with large number of cases
2. Monitor query performance
3. Check database indexes

## Security Testing

### Authentication Testing
1. Test session management
2. Verify JWT token validation
3. Test logout functionality

### Authorization Testing
1. Verify respondents can only access their own cases
2. Test cross-user data access prevention
3. Verify admin access controls

## Troubleshooting

### Common Issues

1. **Dashboard not loading**
   - Check user role is set to 'RESPONDENT'
   - Verify API endpoints are accessible
   - Check authentication status

2. **Cases not appearing**
   - Verify RespondentCase records exist
   - Check case assignment logic
   - Verify database relationships

3. **Response submission failing**
   - Check form validation
   - Verify API endpoint functionality
   - Check database constraints

4. **Notifications not working**
   - Verify notification service is running
   - Check email service configuration
   - Verify notification creation logic

### Database Queries for Debugging

```sql
-- Check respondent users
SELECT * FROM User WHERE role = 'RESPONDENT';

-- Check respondent cases
SELECT rc.*, c.name as case_name, u.name as respondent_name 
FROM RespondentCase rc
JOIN Arbitration c ON rc.caseId = c.id
JOIN User u ON rc.respondentId = u.id;

-- Check case responses
SELECT cr.*, c.name as case_name, u.name as respondent_name
FROM CaseResponse cr
JOIN Arbitration c ON cr.caseId = c.id
JOIN User u ON cr.respondentId = u.id;

-- Check notifications
SELECT * FROM Notification WHERE recipientId IN (
  SELECT id FROM User WHERE role = 'RESPONDENT'
);
```

## Success Criteria

The respondent functionality is working correctly when:

1. ✅ Respondent users can register and login
2. ✅ Respondent dashboard displays accurate data
3. ✅ Respondents can view assigned cases
4. ✅ Respondents can submit responses to cases
5. ✅ Notifications are created and displayed properly
6. ✅ Email notifications are sent correctly
7. ✅ API endpoints return expected data
8. ✅ Access control works properly
9. ✅ Error handling works as expected
10. ✅ Integration with existing claimant workflow works

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Conduct user acceptance testing
3. Performance optimization if needed
4. Documentation updates
5. Production deployment 