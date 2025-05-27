# Data Isolation Fix - Testing Guide

## Issue Fixed
- **Problem**: New claimant users were seeing previous user data instead of empty dashboards
- **Root Cause**: API proxy endpoints were not properly passing JWT authentication tokens to backend
- **Solution**: Fixed authentication to use Authorization header instead of non-existent NextAuth sessions

## Files Changed
1. `/pages/api/arbitration/cases/index.ts` - Fixed user-specific case filtering
2. `/pages/api/arbitration/draft/index.ts` - Fixed user-specific draft filtering
3. `/scripts/create-test-users.ts` - Fixed bcrypt import for test user creation

## How to Test the Fix

### Test 1: Register New User (Should Show Empty State)
1. **Clear browser data** (localStorage, cookies)
2. **Register a new claimant account** with fresh email
3. **Login and check dashboard**
   - ✅ Should show "No cases" message 
   - ✅ Should show "No drafts" message
   - ❌ Should NOT show any previous user data

### Test 2: Submit Case (Should Only Show Your Data)
1. **Submit a new arbitration case** from the new account
2. **Check dashboard** 
   - ✅ Should show only YOUR submitted case
   - ❌ Should NOT show cases from other users

### Test 3: Test User Isolation
1. **Create test users** (if needed):
   ```bash
   cd arbitration
   npx ts-node scripts/create-test-users.ts
   ```

2. **Login as different test users**:
   - `claimant@test.com / Test123!`
   - `respondent@test.com / Test123!`

3. **Verify each user only sees their own data**

### Test 4: Browser Network Tab Verification
1. **Open browser DevTools > Network tab**
2. **Login and navigate to dashboard** 
3. **Check API calls**:
   - Look for `/api/arbitration/cases` request
   - ✅ Should have `Authorization: Bearer <token>` header
   - ✅ Backend should return user-specific data only

## Expected Behavior After Fix

### New Users
- ✅ Empty dashboard with no previous user data
- ✅ Clean slate for cases and drafts
- ✅ Proper welcome messages

### Existing Users  
- ✅ Only see their own submitted cases
- ✅ Only see their own saved drafts
- ✅ No data leakage between users

### API Responses
- ✅ `/api/arbitration/cases` returns user-specific cases only
- ✅ `/api/arbitration/draft` returns user-specific drafts only
- ✅ All requests properly authenticated with JWT tokens

## If Issue Persists

1. **Check browser console** for authentication errors
2. **Check network tab** to verify Authorization headers are present
3. **Clear localStorage** and try fresh login
4. **Verify backend is running** and accessible at configured URL

## Backend Verification
The backend already had proper user filtering built in:
- `arbitrationService.getCasesByUser(req.user.id, filters)` 
- `arbitrationService.getDraftsByUser(req.user.id)`

The fix ensures the frontend properly authenticates requests so the backend can identify the user correctly. 