# Profile Save Failure Reproduction & Fix Documentation

## Original Issue
Users reported "Failed to save profile" error when attempting to save their profile after Internet Identity login.

## Root Cause Analysis
The `useSaveCallerUserProfile` mutation lacked the same authentication and actor-readiness guards that were implemented for `useCreateField`. This caused the mutation to attempt backend calls before:
1. The actor was fully initialized after login
2. The identity was properly authenticated
3. The actor readiness state was confirmed

## Reproduction Steps (Before Fix)

### Scenario 1: Immediate Post-Login Profile Save
1. Open the application in an incognito/private browser window
2. Click "Login" and complete Internet Identity authentication
3. Immediately after redirect, the Profile Setup modal appears
4. Enter a name and click "Continue" within 1-2 seconds
5. **Expected Error**: "Failed to save profile" toast with raw backend error

### Scenario 2: Anonymous User Attempt
1. Open the application without logging in
2. If the Profile Setup modal somehow appears (edge case)
3. Attempt to save profile
4. **Expected Error**: Backend trap about anonymous caller

## Implemented Fixes

### 1. Profile Save Error Normalization (`frontend/src/utils/profileSaveErrors.ts`)
- Created error normalization utility similar to `fieldCreationErrors.ts`
- Maps error categories: login-required, actor-initializing, actor-unavailable, authorization, unknown
- Provides clear English messages instead of raw backend traps

### 2. Enhanced Profile Save Mutation (`frontend/src/hooks/useQueries.ts`)
Added comprehensive guards to `useSaveCallerUserProfile`:
- **Authentication Guard**: Blocks anonymous/unauthenticated users with clear message
- **Actor Readiness Guard**: Prevents submission during actor initialization
- **Actor Availability Guard**: Ensures actor exists before attempting save
- **Error Normalization**: Routes all errors through `normalizeProfileSaveError`
- **Enhanced Logging**: Comprehensive console logging for debugging

### 3. Improved Profile Setup Modal UI (`frontend/src/components/ProfileSetupModal.tsx`)
- Added inline status alerts for login-required and actor-initializing states
- Disabled form submission when guards are not satisfied
- Clear visual feedback with loading spinner and disabled state
- Prevents user confusion by showing why submission is blocked

### 4. Automatic Dashboard Transition
- On successful profile save, immediately invalidates and refetches `currentUserProfile` query
- App.tsx's `showProfileSetup` condition automatically resolves to false
- User is seamlessly transitioned to Dashboard without manual refresh
- Failed saves keep modal open with preserved input for retry

## Validation Steps (After Fix)

### Test Case 1: Normal Authenticated Flow
1. Login with Internet Identity
2. Wait for "Connection is still initializing" message to clear
3. Enter name and submit
4. **Expected**: Success toast, automatic transition to Dashboard
5. **Verify**: Profile is saved and persists on refresh

### Test Case 2: Immediate Post-Login (Race Condition)
1. Login with Internet Identity
2. Immediately attempt to submit profile (within 1 second)
3. **Expected**: "Connection is still initializing" alert shown, submit button disabled
4. Wait for alert to clear
5. Submit profile
6. **Expected**: Success toast, automatic transition to Dashboard

### Test Case 3: Anonymous User Protection
1. Open application without logging in
2. **Expected**: LoginPrompt shown, not Profile Setup modal
3. If Profile Setup modal appears (edge case), submit button should be disabled with "Please log in" alert

### Test Case 4: Retry After Failure
1. Simulate network failure or backend error
2. Attempt profile save
3. **Expected**: Clear error message in toast
4. Modal remains open with entered name preserved
5. Fix issue and retry
6. **Expected**: Success toast, automatic transition to Dashboard

## Debug Logging Reference
All profile save operations log with `[SaveProfile]` prefix:
- Mutation attempt started
- Guard checks (actor, identity, readiness)
- Backend call success/failure
- Error normalization
- Cache updates

## Acceptance Criteria Met
✅ Clear repro scenario documented with observed error messages  
✅ Authentication guard prevents anonymous users from attempting save  
✅ Actor readiness guard prevents submission during initialization  
✅ UI displays normalized English messages, not raw backend traps  
✅ Successful save automatically transitions to Dashboard  
✅ Failed save keeps modal open and allows retry  
✅ Profile persists correctly after save  
