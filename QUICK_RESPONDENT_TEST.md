# Quick Respondent Testing Checklist

## 🚀 Getting Started

### 1. Set up Test Data
```bash
# Create test users and cases
node scripts/test-respondent-functionality.js create
```

### 2. Start the Application
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (if separate)
cd backend
npm run start:dev
```

## ✅ Manual Testing Checklist

### Phase 1: User Authentication & Access

- [ ] **Register Respondent User**
  - Navigate to `/auth/register`
  - Create user with role "RESPONDENT"
  - Verify successful registration

- [ ] **Login as Respondent**
  - Navigate to `/auth/login`
  - Login with respondent credentials
  - Verify redirect to dashboard

- [ ] **Access Control**
  - Try accessing `/respondent/dashboard` without login → Should redirect to login
  - Try accessing as non-respondent user → Should show access denied

### Phase 2: Dashboard Functionality

- [ ] **Dashboard Loading**
  - Navigate to `/respondent/dashboard`
  - Verify page loads without errors
  - Check for user welcome message

- [ ] **Statistics Display**
  - [ ] Total Cases count
  - [ ] Pending Responses count
  - [ ] Submitted Responses count
  - [ ] Unread Notifications count

- [ ] **Cases List**
  - [ ] Cases are displayed in cards/table
  - [ ] Case names and numbers are shown
  - [ ] Response status is indicated
  - [ ] Deadline information is visible
  - [ ] Overdue cases are highlighted

- [ ] **Notifications Panel**
  - [ ] Recent notifications are displayed
  - [ ] Notification count matches stats
  - [ ] Notifications show relevant case info

### Phase 3: Case Details

- [ ] **Case Navigation**
  - Click on case from dashboard
  - Navigate to `/respondent/case/[id]`
  - Verify case details load correctly

- [ ] **Case Information Display**
  - [ ] Case overview (name, number, status)
  - [ ] Claimant information
  - [ ] Dispute details
  - [ ] Arbitration agreement
  - [ ] Response deadline
  - [ ] Current phase status

- [ ] **Document Access**
  - [ ] Case documents are listed
  - [ ] Documents can be downloaded/viewed
  - [ ] Evidence files are accessible

### Phase 4: Response Submission

- [ ] **Response Form**
  - [ ] Response form is accessible
  - [ ] Text area for response
  - [ ] File upload for supporting documents
  - [ ] Contact preferences section

- [ ] **Form Validation**
  - [ ] Required fields are validated
  - [ ] File upload restrictions work
  - [ ] Form shows validation errors

- [ ] **Response Submission**
  - [ ] Form submits successfully
  - [ ] Success message is displayed
  - [ ] Response status updates to "SUBMITTED"
  - [ ] Dashboard reflects the change

### Phase 5: API Testing

- [ ] **Dashboard API**
  ```bash
  # Test dashboard endpoint
  curl -X GET http://localhost:3000/api/respondent/dashboard \
    -H "Cookie: next-auth.session-token=YOUR_TOKEN"
  ```

- [ ] **Cases API**
  ```bash
  # Test cases endpoint
  curl -X GET http://localhost:3000/api/respondent/cases \
    -H "Cookie: next-auth.session-token=YOUR_TOKEN"
  ```

- [ ] **Case Details API**
  ```bash
  # Test specific case endpoint
  curl -X GET http://localhost:3000/api/respondent/cases/CASE_ID \
    -H "Cookie: next-auth.session-token=YOUR_TOKEN"
  ```

### Phase 6: Edge Cases & Error Handling

- [ ] **Invalid Case Access**
  - Try accessing non-existent case ID
  - Try accessing case not assigned to user
  - Verify proper error messages

- [ ] **Response Deadline**
  - [ ] Check overdue case indicators
  - [ ] Verify deadline warnings
  - [ ] Test response submission after deadline

- [ ] **Network Errors**
  - [ ] Test with backend offline
  - [ ] Verify error messages are user-friendly
  - [ ] Check loading states

### Phase 7: Integration Testing

- [ ] **End-to-End Workflow**
  1. [ ] Claimant creates case with respondent details
  2. [ ] Respondent receives notification
  3. [ ] Respondent logs in and views case
  4. [ ] Respondent submits response
  5. [ ] Case status updates appropriately

- [ ] **Multi-Respondent Cases**
  - [ ] Multiple respondents can be assigned
  - [ ] Each respondent sees only their assignments
  - [ ] Individual responses are tracked separately

## 🔍 Verification Queries

### Check Database State
```sql
-- Verify respondent users
SELECT id, name, email, role FROM User WHERE role = 'RESPONDENT';

-- Check case assignments
SELECT 
  rc.id,
  rc.responseStatus,
  rc.currentPhase,
  rc.responseDeadline,
  c.name as case_name,
  c.caseNumber,
  u.name as respondent_name
FROM RespondentCase rc
JOIN Arbitration c ON rc.caseId = c.id
JOIN User u ON rc.respondentId = u.id;

-- Check responses
SELECT 
  cr.id,
  cr.status,
  cr.submittedAt,
  c.name as case_name,
  u.name as respondent_name
FROM CaseResponse cr
JOIN Arbitration c ON cr.caseId = c.id
JOIN User u ON cr.respondentId = u.id;
```

## 🐛 Common Issues & Solutions

### Issue: Dashboard not loading
**Solution:** 
- Check user role is set to 'RESPONDENT'
- Verify authentication token
- Check browser console for errors

### Issue: Cases not appearing
**Solution:**
- Verify RespondentCase records exist
- Check case assignment in database
- Ensure user ID matches in assignments

### Issue: Response submission failing
**Solution:**
- Check form validation
- Verify API endpoint is accessible
- Check database constraints

### Issue: Notifications not showing
**Solution:**
- Verify notification records exist
- Check notification service
- Verify database relationships

## 📊 Success Metrics

The respondent functionality is working correctly when:

- ✅ Respondent users can access their dashboard
- ✅ Dashboard shows accurate case statistics
- ✅ Cases are displayed with correct information
- ✅ Case details are accessible and complete
- ✅ Response forms work properly
- ✅ Responses are saved and status updated
- ✅ Notifications are displayed correctly
- ✅ API endpoints return expected data
- ✅ Error handling works appropriately
- ✅ Access control prevents unauthorized access

## 🧹 Cleanup

After testing, clean up test data:
```bash
node scripts/test-respondent-functionality.js cleanup
```

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify database connections
3. Ensure all migrations are applied
4. Check authentication configuration
5. Review API endpoint responses 