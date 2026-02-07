# Deployment and Local Dev Regression Checklist

This checklist validates that build/boot fixes did not introduce regressions in core functionality.

## Pre-Deployment Checks

### Build Process
- [ ] Clean install completes without errors: `pnpm install`
- [ ] Frontend TypeScript build succeeds: `pnpm run build`
- [ ] Backend Motoko canister builds successfully: `dfx build backend`
- [ ] No TypeScript errors in console output
- [ ] No Motoko compilation errors
- [ ] Build artifacts in `frontend/dist` use relative paths (not absolute)

### Deployment
- [ ] Deploy completes successfully: `dfx deploy`
- [ ] Backend canister deploys without errors
- [ ] Frontend assets upload successfully
- [ ] Canister IDs are generated and accessible
- [ ] No "stopped canister" errors

## Redeploy-Only Scenario (No Feature Changes)

When redeploying without code changes (e.g., infrastructure updates, canister restarts):

### Build Validation
- [ ] Build completes without errors (no new build/deploy failures)
- [ ] No unexpected TypeScript or Motoko compilation errors
- [ ] Deployment succeeds to target environment (local/production)
- [ ] Console shows build marker: `[Bootstrap] Pre-React globals initialized | env: ... | build: build-...`

### Production Smoke Test
- [ ] Production app loads successfully (no blank screens or boot errors)
- [ ] Console shows correct stage progression during boot
- [ ] Internet Identity login flow completes successfully
- [ ] After login, Dashboard page loads and displays existing data
- [ ] Console shows: `[App Boot] Stage: dashboard-ready`
- [ ] Core flows still work post-redeploy:
  - [ ] Create new field succeeds
  - [ ] Create new task in field succeeds
  - [ ] Mark task as completed (with undo toast) succeeds
  - [ ] Export JSON downloads successfully
  - [ ] Import JSON with confirmation dialog succeeds
- [ ] No console errors during smoke test operations
- [ ] Existing user data persists correctly after redeploy
- [ ] No RecoverableBootError or pre-React fallback UI appears

### Rollback Readiness
- [ ] Previous version canister ID documented (if needed for rollback)
- [ ] Backup of production data exists (export JSON before redeploy)
- [ ] Rollback procedure tested and ready if issues detected

## Local Dev Boot Flow

### Anonymous/Logged Out State
- [ ] App loads and shows login prompt (not blank page)
- [ ] No console errors during initial load
- [ ] Console shows: `[App Boot] Stage: unauthenticated`
- [ ] "Initializing..." spinner shows briefly then transitions to login prompt
- [ ] Login button is clickable and functional

### Login Flow
- [ ] Clicking login opens Internet Identity
- [ ] After successful login, app shows "Initializing..." briefly
- [ ] Console shows stage progression: `actor-initializing` → `profile-loading`
- [ ] For new users: Profile setup modal appears automatically
- [ ] For existing users: Dashboard loads directly
- [ ] No "You don't have a draft yet" message appears incorrectly
- [ ] No indefinite "Initializing..." spinner (watchdog timeout works)

### Profile Setup (New Users)
- [ ] Profile setup modal appears after first login
- [ ] Console shows: `[App Boot] Stage: profile-setup-required`
- [ ] Name input field is functional
- [ ] "Save Profile" button works
- [ ] After saving, modal closes and dashboard appears
- [ ] Console shows: `[App Boot] Stage: dashboard-ready`
- [ ] Profile name appears in header dropdown

## Core Functionality Tests

### Authentication
- [ ] Login with Internet Identity succeeds
- [ ] User profile name displays in header after login
- [ ] Logout clears all cached data
- [ ] After logout, login prompt appears again
- [ ] Console shows: `[App Boot] Stage: unauthenticated` after logout
- [ ] Re-login works without errors

### Fields CRUD
- [ ] "New Field" button is enabled after login
- [ ] Creating a new field succeeds
- [ ] New field appears in the Fields tab immediately
- [ ] Field name can be edited
- [ ] Field can be deleted (when conditions allow)
- [ ] Field cards show correct metrics

### Tasks CRUD
- [ ] Creating a task in a field succeeds
- [ ] Task appears in field detail view immediately
- [ ] Task attributes (urgency, value, interest, influence, duration) save correctly
- [ ] Task can be edited
- [ ] Task can be marked complete (with undo toast)
- [ ] Task can be deleted
- [ ] Completed tasks disappear from active views

### Field Detail View
- [ ] Clicking a field card opens field detail view
- [ ] Search bar filters tasks by name
- [ ] Sort dropdown changes task order
- [ ] Sort direction toggle (ascending/descending) works
- [ ] Active sort criterion is highlighted
- [ ] Filter by attribute works
- [ ] Task count and duration metrics are accurate

### All Tasks View
- [ ] "All Tasks" tab shows all uncompleted tasks across fields
- [ ] Search filters tasks correctly
- [ ] Sort dropdown changes task order
- [ ] Sort direction toggle works
- [ ] Active sort criterion is highlighted
- [ ] Tasks from different fields are distinguishable

### Backup and Restore
- [ ] Export button downloads a JSON file
- [ ] Exported file contains all fields and tasks
- [ ] Import button accepts valid JSON files
- [ ] Import confirmation dialog shows field/task counts
- [ ] Importing restores fields and tasks correctly
- [ ] Import shows success message
- [ ] Invalid JSON shows error message

## Error Handling

### Network Errors
- [ ] Network failures show appropriate error messages
- [ ] Retry button appears for recoverable errors
- [ ] Retry successfully recovers from transient errors

### Authorization Errors
- [ ] Attempting actions without login shows appropriate error
- [ ] "User is not registered" errors trigger profile setup flow
- [ ] Authorization failures show clear error messages

### Boot Errors
- [ ] Pre-React fallback UI displays for early boot failures
- [ ] Pre-React fallback shows stage badge
- [ ] Pre-React fallback shows sanitized error message
- [ ] Pre-React fallback has working copy-to-clipboard button
- [ ] RecoverableBootError screen displays for post-React boot failures
- [ ] RecoverableBootError shows stage information
- [ ] RecoverableBootError shows build marker
- [ ] RecoverableBootError has working retry button
- [ ] RecoverableBootError has working logout button
- [ ] RecoverableBootError has working copy error details button
- [ ] AppErrorBoundary catches render errors and shows fallback
- [ ] AppErrorBoundary shows stage-tagged diagnostics
- [ ] Watchdog timeout triggers RecoverableBootError after 15 seconds
- [ ] Watchdog shows correct stuck reason (actor-init-timeout, profile-fetch-timeout, etc.)

### Console Diagnostics
- [ ] Console shows clear stage transitions during boot
- [ ] Console shows build marker on initial load
- [ ] Console logs include stage information for errors
- [ ] Console logs include build marker for errors
- [ ] No unexpected errors or warnings in console during normal use

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome/Edge: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work

### Mobile Browsers
- [ ] Mobile Chrome: Core features work
- [ ] Mobile Safari: Core features work
- [ ] Responsive layout works on mobile

## Performance

### Load Times
- [ ] Initial page load completes in < 3 seconds
- [ ] Login flow completes in < 5 seconds
- [ ] Dashboard loads in < 2 seconds after login

### Responsiveness
- [ ] UI remains responsive during data operations
- [ ] No UI freezes or hangs
- [ ] Loading indicators show during operations

## Accessibility

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible

### Screen Readers
- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Loading states are announced

## Sign-Off

After completing this checklist:

**Test Environment:**
- [ ] Local development
- [ ] Production

**Test Date:** _______________
**Tested by:** _______________
**All tests passed:** [ ] Yes [ ] No

**Issues found:**
- Issue 1: _______________
- Issue 2: _______________
- Issue 3: _______________

**Approval:**
- Approved by: _______________
- Status: [ ] APPROVED [ ] APPROVED WITH WARNINGS [ ] REJECTED

**Next Steps:**
- [ ] Document any issues found
- [ ] Create tickets for non-blocking issues
- [ ] Schedule follow-up testing if needed

---

**Note:** For production redeploys, always run the focused smoke test procedure first (`frontend/docs/production-smoke-check-procedure.md`). Use this comprehensive checklist for major releases or when smoke test reveals issues.
