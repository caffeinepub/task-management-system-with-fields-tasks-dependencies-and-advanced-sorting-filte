# Production Smoke Check Procedure

This procedure provides a concise, production-focused smoke test designed to be run immediately after a production redeploy. It validates the critical path and core functionality without expanding into a full regression suite.

## Purpose

Use this procedure to:
- Quickly validate that production is functional after redeploy
- Confirm the critical path (load → login → authenticated Dashboard) works
- Test a minimal set of core CRUD flows
- Identify any deployment issues before users encounter them

**Time estimate:** 15-20 minutes for complete smoke test

## Prerequisites

- [ ] Production deployment completed successfully
- [ ] Production URL accessible
- [ ] Internet Identity credentials available for testing
- [ ] Copy of `production-smoke-check-results-template.md` ready for recording results

## Recording Results

**Important:** Record all test results in `frontend/docs/production-smoke-check-results-template.md` as you execute this procedure.

For each test:
- Mark [ ] PASS if the test succeeds
- Mark [ ] FAIL if the test fails (document details in Notes)
- Mark [ ] N/A if the test is not applicable
- Add notes for any unexpected behavior, even if test passes

## Alignment with Regression Checklist

This smoke test is a focused subset of the comprehensive regression checklist documented in `frontend/docs/deploy-and-localdev-regression-checklist.md`. 

**Key differences:**
- Smoke test: Quick validation of critical path + core flows (15-20 min)
- Regression checklist: Comprehensive validation of all features (45-60 min)

**When to use each:**
- Use smoke test: After every production redeploy (mandatory)
- Use regression checklist: Before major releases, after significant code changes, or when smoke test reveals issues

## Critical Path Tests (Must Pass)

These tests validate the absolute minimum functionality required for production to be considered operational.

### Test 1: App Load

**Steps:**
1. Open production URL in browser
2. Observe initial load behavior
3. Check browser console for errors

**Expected:**
- App loads without blank screens
- No boot errors or fallback UI appears
- Login prompt displays correctly
- No JavaScript errors in console

**Record in template:** Section "Critical Path > App Load"

### Test 2: Internet Identity Login

**Steps:**
1. Click the "Login" button
2. Complete Internet Identity authentication flow
3. Observe post-login behavior

**Expected:**
- Login button is clickable
- Internet Identity flow completes successfully
- After login, app shows "Initializing..." briefly (not indefinitely)
- No errors during login process

**Record in template:** Section "Critical Path > Internet Identity Login"

### Test 3: Authenticated Dashboard Access

**Steps:**
1. After successful login, observe dashboard
2. Check that existing data displays
3. Verify user profile in header
4. Check browser console

**Expected:**
- Dashboard loads after login
- Existing fields display correctly (if any exist)
- User profile name appears in header dropdown
- No console errors in browser DevTools

**Record in template:** Section "Critical Path > Authenticated Dashboard Access"

**If any critical path test fails, STOP and initiate rollback procedure.**

## Core Functionality Tests

These tests validate essential CRUD operations and data flows.

### Test 4: Profile Management (New Users Only)

**Steps:**
1. If testing with a new Internet Identity:
   - Observe if profile setup modal appears
   - Enter a name
   - Click "Save Profile"
   - Verify name appears in header

**Expected:**
- Profile setup modal appears automatically for new users
- Profile name saves successfully
- Profile name displays in header dropdown

**Record in template:** Section "Core Functionality Tests > Profile Management"

**Note:** Mark N/A if testing with existing user profile.

### Test 5: Field Creation

**Steps:**
1. Click "New Field" button
2. Enter field name (e.g., "Smoke Test Field")
3. Select an icon and color
4. Click "Create Field"
5. Verify field appears in Fields tab

**Expected:**
- "New Field" button is enabled after login
- Creating a new field succeeds
- New field appears in Fields tab immediately
- Field card shows correct name, icon, and color

**Record in template:** Section "Core Functionality Tests > Fields CRUD"

### Test 6: Task Creation

**Steps:**
1. Click on the field created in Test 5
2. Click "New Task" button
3. Enter task name (e.g., "Smoke Test Task")
4. Set attributes (urgency: 3, value: 4, interest: 3, influence: 2)
5. Set duration (e.g., 30 minutes)
6. Click "Create Task"
7. Verify task appears in field detail view

**Expected:**
- Creating a task in a field succeeds
- Task appears in field detail view immediately
- Task attributes save correctly
- Task card displays all information

**Record in template:** Section "Core Functionality Tests > Tasks CRUD"

### Test 7: Task Completion and Undo

**Steps:**
1. In the field detail view, find the task created in Test 6
2. Click the checkbox to mark task complete
3. Observe the undo toast notification
4. Click "Undo" in the toast (within 5 seconds)
5. Verify task returns to active state

**Expected:**
- Task can be marked complete
- Undo toast appears after marking complete (5-second window)
- Undo button restores task to active state
- Task reappears in active task list

**Record in template:** Section "Core Functionality Tests > Tasks CRUD"

### Test 8: Field Editing

**Steps:**
1. Return to Fields tab (click "Back to Dashboard" or navigate)
2. Click the edit icon on the smoke test field
3. Change the field name (e.g., "Updated Smoke Test Field")
4. Change the icon or color
5. Click "Save Changes"
6. Verify changes appear immediately

**Expected:**
- Field name can be edited
- Field icon and color can be changed
- Changes save successfully
- Field card updates immediately

**Record in template:** Section "Core Functionality Tests > Fields CRUD"

### Test 9: Export Data

**Steps:**
1. From the Dashboard, click "Export Data" button
2. Observe loading state
3. Wait for JSON file to download
4. Open the downloaded file and verify contents

**Expected:**
- Export button is enabled after login
- Export button shows loading state during operation
- JSON file downloads successfully
- Exported file contains all fields and tasks
- Exported file includes icon, color, and backgroundColor fields

**Record in template:** Section "Core Functionality Tests > Export Data"

### Test 10: Import Data (Validation Only)

**Steps:**
1. Click "Import Data" button
2. Select the JSON file exported in Test 9
3. Observe confirmation dialog
4. **Do NOT confirm import** (click Cancel)

**Expected:**
- Import button is enabled after login
- Import button opens file picker
- Confirmation dialog shows field/task counts
- Confirmation dialog warns about data overwrite
- Cancel button closes dialog without importing

**Record in template:** Section "Core Functionality Tests > Import Data"

**Note:** We validate the import flow but don't execute it to avoid overwriting production data. If you need to test actual import, use a test account or restore from backup afterward.

### Test 11: Field Deletion (Cleanup)

**Steps:**
1. Navigate to the smoke test field detail view
2. Delete the smoke test task (if not already deleted)
3. Return to Fields tab
4. Click delete icon on the smoke test field
5. Confirm deletion
6. Verify field is removed

**Expected:**
- Task can be deleted
- Field can be deleted (when no tasks exist)
- Deletion confirmation dialog appears
- Field disappears from Fields tab after deletion

**Record in template:** Section "Core Functionality Tests > Fields CRUD"

### Test 12: Logout and Re-login

**Steps:**
1. Click user profile dropdown in header
2. Click "Logout"
3. Observe logout behavior
4. Click "Login" again
5. Complete Internet Identity flow
6. Verify dashboard loads correctly

**Expected:**
- Logout button in header dropdown works
- Logout clears all cached data
- After logout, login prompt appears
- Re-login works without errors
- Dashboard loads correctly after re-login

**Record in template:** Section "Core Functionality Tests > Logout and Re-login"

## Error Handling Checks

### Test 13: Console Errors

**Steps:**
1. Open browser DevTools (F12)
2. Navigate to Console tab
3. Review all messages from the smoke test session

**Expected:**
- No JavaScript errors during normal operations
- No React warnings or errors
- No network errors (except expected transient failures)

**Record in template:** Section "Browser Console Check > Console Errors"

**Document:**
- Total error count
- Sample error messages (if any)

### Test 14: Pre-React Fallback UI

**Observation:**
During the entire smoke test, note if the pre-React fallback UI ever appeared.

**Expected:**
- No pre-React fallback UI appears during normal use

**If fallback appeared:**
- Document when it appeared (during boot, during runtime)
- Verify it showed sanitized error messages
- Test copy-to-clipboard functionality

**Record in template:** Section "Error Handling and Edge Cases > Pre-React Fallback UI"

### Test 15: RecoverableBootError Screen

**Observation:**
During the entire smoke test, note if the RecoverableBootError screen ever appeared.

**Expected:**
- No RecoverableBootError screen appears during normal use

**If error screen appeared:**
- Document when it appeared (during boot, during runtime)
- Verify it shows stage information
- Test retry button (if applicable)
- Test logout button

**Record in template:** Section "Error Handling and Edge Cases > RecoverableBootError Screen"

## Completing the Smoke Test

### Final Steps

1. **Review all recorded results** in `production-smoke-check-results-template.md`
2. **Calculate pass rate:** (Passed tests / Total applicable tests) × 100%
3. **Identify critical issues:** Any failures that block core functionality
4. **Make recommendation:**
   - Deploy is successful, no action needed
   - Deploy is successful with minor warnings, monitor in production
   - Deploy has critical issues, initiate rollback

### Sign-Off

Complete the sign-off section in the results template:

- **Tested by:** Your name
- **Approved by:** Team lead or reviewer
- **Status:** APPROVED / APPROVED WITH WARNINGS / REJECTED
- **Next Steps:** Document any follow-up actions

## Troubleshooting

If tests fail, refer to the troubleshooting section in `frontend/docs/production-redeploy-runbook.md` for common issues and resolutions.

**Common failure scenarios:**

- **Critical path fails:** Initiate rollback immediately
- **CRUD operations fail:** Check backend canister status, verify actor initialization
- **Data not persisting:** Check for backend state reset, verify canister IDs
- **Console errors:** Capture full stack traces, check network tab for failed requests

## Post-Smoke Test Actions

### If All Tests Pass

- [ ] Mark deployment as successful
- [ ] Notify team of successful deployment
- [ ] Continue monitoring for 24 hours
- [ ] Archive smoke test results with deployment records

### If Tests Fail

- [ ] Document all failures in detail
- [ ] Assess severity (critical vs. non-critical)
- [ ] If critical: Initiate rollback procedure
- [ ] If non-critical: Create tickets for follow-up
- [ ] Schedule post-mortem if needed

### If Tests Pass with Warnings

- [ ] Document warnings in results template
- [ ] Assess risk of warnings
- [ ] Create tickets for non-blocking issues
- [ ] Increase monitoring frequency
- [ ] Plan hotfix if needed

---

**Remember:** This smoke test is a quick validation, not a comprehensive regression test. For full validation, use the complete regression checklist in `frontend/docs/deploy-and-localdev-regression-checklist.md`.
