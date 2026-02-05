# Production Smoke Check Results

**Date:** _________________  
**Deployed by:** _________________  
**Production URL:** _________________  
**Backend Canister ID:** _________________  
**Frontend Canister ID:** _________________  

## Critical Path (Must Pass)

### App Load
- [ ] PASS  [ ] FAIL - Production app loads without blank screens
- [ ] PASS  [ ] FAIL - No boot errors or fallback UI appears
- [ ] PASS  [ ] FAIL - Login prompt displays correctly
- **Notes:** _________________

### Internet Identity Login
- [ ] PASS  [ ] FAIL - Login button is clickable
- [ ] PASS  [ ] FAIL - Internet Identity flow completes successfully
- [ ] PASS  [ ] FAIL - After login, app shows "Initializing..." briefly (not indefinitely)
- **Notes:** _________________

### Authenticated Dashboard Access
- [ ] PASS  [ ] FAIL - Dashboard loads after login
- [ ] PASS  [ ] FAIL - Existing fields display correctly
- [ ] PASS  [ ] FAIL - User profile name appears in header
- [ ] PASS  [ ] FAIL - No console errors in browser DevTools
- **Notes:** _________________

## Core Functionality Tests

### Profile Management
- [ ] PASS  [ ] FAIL  [ ] N/A - Profile setup modal appears for new users
- [ ] PASS  [ ] FAIL - Profile name saves successfully
- [ ] PASS  [ ] FAIL - Profile name displays in header dropdown
- **Notes:** _________________

### Fields CRUD
- [ ] PASS  [ ] FAIL - "New Field" button is enabled after login
- [ ] PASS  [ ] FAIL - Creating a new field succeeds
- [ ] PASS  [ ] FAIL - New field appears in Fields tab immediately
- [ ] PASS  [ ] FAIL - Field name can be edited
- [ ] PASS  [ ] FAIL - Field icon and color can be changed
- [ ] PASS  [ ] FAIL - Field can be deleted (when no tasks exist)
- [ ] PASS  [ ] FAIL - Field cards show correct metrics (avg attributes, task count, duration)
- **Notes:** _________________

### Tasks CRUD
- [ ] PASS  [ ] FAIL - Creating a task in a field succeeds
- [ ] PASS  [ ] FAIL - Task appears in field detail view immediately
- [ ] PASS  [ ] FAIL - Task attributes (urgency, value, interest, influence, duration) save correctly
- [ ] PASS  [ ] FAIL - Task can be edited
- [ ] PASS  [ ] FAIL - Task duration can be cleared (empty input)
- [ ] PASS  [ ] FAIL - Task can be marked complete
- [ ] PASS  [ ] FAIL - Undo toast appears after marking complete (5-second window)
- [ ] PASS  [ ] FAIL - Undo button restores task to active state
- [ ] PASS  [ ] FAIL - Task can be deleted
- [ ] PASS  [ ] FAIL - Completed tasks disappear from active views
- **Notes:** _________________

### Field Detail View
- [ ] PASS  [ ] FAIL - Clicking a field card opens field detail view
- [ ] PASS  [ ] FAIL - Search bar filters tasks by name
- [ ] PASS  [ ] FAIL - Sort dropdown changes task order
- [ ] PASS  [ ] FAIL - Sort direction toggle (ascending/descending) works
- [ ] PASS  [ ] FAIL - Active sort criterion is highlighted
- [ ] PASS  [ ] FAIL - Filter by attribute works
- [ ] PASS  [ ] FAIL - Task count and duration metrics are accurate
- [ ] PASS  [ ] FAIL - Delete field button appears and works
- **Notes:** _________________

### All Tasks View
- [ ] PASS  [ ] FAIL - "All Tasks" tab shows all uncompleted tasks across fields
- [ ] PASS  [ ] FAIL - Search filters tasks correctly
- [ ] PASS  [ ] FAIL - Sort dropdown changes task order
- [ ] PASS  [ ] FAIL - Sort direction toggle works
- [ ] PASS  [ ] FAIL - Active sort criterion is highlighted
- [ ] PASS  [ ] FAIL - Field tags display on task cards
- [ ] PASS  [ ] FAIL - Tasks from different fields are distinguishable
- **Notes:** _________________

### Export Data
- [ ] PASS  [ ] FAIL - Export button is enabled after login
- [ ] PASS  [ ] FAIL - Export button shows loading state during operation
- [ ] PASS  [ ] FAIL - JSON file downloads successfully
- [ ] PASS  [ ] FAIL - Exported file contains all fields and tasks
- [ ] PASS  [ ] FAIL - Exported file includes icon and color fields
- [ ] PASS  [ ] FAIL - Success message appears after export
- **Notes:** _________________

### Import Data
- [ ] PASS  [ ] FAIL - Import button is enabled after login
- [ ] PASS  [ ] FAIL - Import button opens file picker
- [ ] PASS  [ ] FAIL - Confirmation dialog shows field/task counts
- [ ] PASS  [ ] FAIL - Confirmation dialog warns about data overwrite
- [ ] PASS  [ ] FAIL - Importing valid JSON succeeds
- [ ] PASS  [ ] FAIL - Imported fields and tasks appear correctly
- [ ] PASS  [ ] FAIL - Success message appears after import
- [ ] PASS  [ ] FAIL - Invalid JSON shows error message
- [ ] PASS  [ ] FAIL - Backward compatibility: older exports without icon/color work
- **Notes:** _________________

### Logout and Re-login
- [ ] PASS  [ ] FAIL - Logout button in header dropdown works
- [ ] PASS  [ ] FAIL - Logout clears all cached data
- [ ] PASS  [ ] FAIL - After logout, login prompt appears
- [ ] PASS  [ ] FAIL - Re-login works without errors
- [ ] PASS  [ ] FAIL - Dashboard loads correctly after re-login
- **Notes:** _________________

## Error Handling and Edge Cases

### Pre-React Fallback UI
- [ ] PASS  [ ] FAIL - No pre-React fallback UI appears during normal use
- [ ] PASS  [ ] FAIL - If fallback appears, it shows sanitized error messages
- [ ] PASS  [ ] FAIL - Copy-to-clipboard functionality works in fallback UI
- **Occurrences:** [ ] None  [ ] During boot  [ ] During runtime  
- **Notes:** _________________

### RecoverableBootError Screen
- [ ] PASS  [ ] FAIL - No RecoverableBootError screen appears during normal use
- [ ] PASS  [ ] FAIL - If error screen appears, it shows stage information
- [ ] PASS  [ ] FAIL - Retry button works for recoverable errors
- [ ] PASS  [ ] FAIL - Logout button clears auth and returns to login
- **Occurrences:** [ ] None  [ ] During boot  [ ] During runtime  
- **Notes:** _________________

### Network and Authorization Errors
- [ ] PASS  [ ] FAIL - Network failures show appropriate error messages
- [ ] PASS  [ ] FAIL - Unauthorized actions show clear error messages
- [ ] PASS  [ ] FAIL - Missing profile triggers profile setup modal
- [ ] PASS  [ ] FAIL - Actor initialization errors are handled gracefully
- **Notes:** _________________

### Validation Errors
- [ ] PASS  [ ] FAIL - Empty field names are rejected with clear message
- [ ] PASS  [ ] FAIL - Empty task names are rejected with clear message
- [ ] PASS  [ ] FAIL - Invalid attribute values are rejected
- [ ] PASS  [ ] FAIL - Error messages guide user to fix issues
- **Notes:** _________________

## Performance and UX

### Loading States
- [ ] PASS  [ ] FAIL - Spinners appear during async operations
- [ ] PASS  [ ] FAIL - Buttons show loading state during mutations
- [ ] PASS  [ ] FAIL - No blank screens or frozen UI
- [ ] PASS  [ ] FAIL - Transitions are smooth and responsive
- **Notes:** _________________

### Data Consistency
- [ ] PASS  [ ] FAIL - Field metrics update after task changes
- [ ] PASS  [ ] FAIL - Task counts are accurate
- [ ] PASS  [ ] FAIL - Duration totals are correct
- [ ] PASS  [ ] FAIL - Changes persist after page refresh
- **Notes:** _________________

### Mobile Responsiveness
- [ ] PASS  [ ] FAIL  [ ] N/A - Dashboard header stacks on small screens
- [ ] PASS  [ ] FAIL  [ ] N/A - Action buttons wrap to prevent horizontal overflow
- [ ] PASS  [ ] FAIL  [ ] N/A - Task cards display correctly on mobile
- [ ] PASS  [ ] FAIL  [ ] N/A - Dialogs are usable on mobile devices
- **Notes:** _________________

## Browser Console Check

### Console Errors
- [ ] PASS  [ ] FAIL - No JavaScript errors during normal operations
- [ ] PASS  [ ] FAIL - No React warnings or errors
- [ ] PASS  [ ] FAIL - No network errors (except expected transient failures)
- **Error Count:** _________________  
- **Sample Errors:** _________________

### Console Warnings
- [ ] PASS  [ ] FAIL - No unexpected warnings
- [ ] PASS  [ ] FAIL - No deprecation warnings
- **Warning Count:** _________________  
- **Sample Warnings:** _________________

## Overall Assessment

### Summary
- **Total Tests:** _________________  
- **Passed:** _________________  
- **Failed:** _________________  
- **N/A:** _________________  
- **Pass Rate:** __________________%

### Critical Issues (Blockers)
_List any issues that prevent core functionality:_

1. _________________
2. _________________
3. _________________

### Non-Critical Issues (Warnings)
_List any issues that don't block core functionality but should be addressed:_

1. _________________
2. _________________
3. _________________

### Recommendations
_Suggested actions based on test results:_

- [ ] Deploy is successful, no action needed
- [ ] Deploy is successful with minor warnings, monitor in production
- [ ] Deploy has critical issues, initiate rollback
- [ ] Deploy requires immediate hotfix for: _________________

### Sign-Off

**Tested by:** _________________  
**Approved by:** _________________  
**Status:** [ ] APPROVED  [ ] APPROVED WITH WARNINGS  [ ] REJECTED  
**Next Steps:** _________________
