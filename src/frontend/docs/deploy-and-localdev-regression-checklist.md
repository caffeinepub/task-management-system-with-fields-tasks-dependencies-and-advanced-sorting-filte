# Deployment and Local Dev Regression Checklist

This checklist validates that build/boot fixes did not introduce regressions in core functionality.

## Pre-Deployment Checks

### Build Process
- [ ] Clean install completes without errors: `pnpm install`
- [ ] Frontend TypeScript build succeeds: `pnpm run build`
- [ ] Backend Motoko canister builds successfully: `dfx build backend`
- [ ] No TypeScript errors in console output
- [ ] No Motoko compilation errors

### Deployment
- [ ] Deploy completes successfully: `dfx deploy`
- [ ] Backend canister deploys without errors
- [ ] Frontend assets upload successfully
- [ ] Canister IDs are generated and accessible

## Redeploy-Only Scenario (No Feature Changes)

When redeploying without code changes (e.g., infrastructure updates, canister restarts):

### Build Validation
- [ ] Build completes without errors (no new build/deploy failures)
- [ ] No unexpected TypeScript or Motoko compilation errors
- [ ] Deployment succeeds to target environment (local/production)

### Production Smoke Test
- [ ] Production app loads successfully (no blank screens or boot errors)
- [ ] Internet Identity login flow completes successfully
- [ ] After login, Dashboard page loads and displays existing data
- [ ] Core flows still work post-redeploy:
  - [ ] Create new field succeeds
  - [ ] Create new task in field succeeds
  - [ ] Mark task as completed (with undo toast) succeeds
  - [ ] Export JSON downloads successfully
  - [ ] Import JSON with confirmation dialog succeeds
- [ ] No console errors during smoke test operations
- [ ] Existing user data persists correctly after redeploy

### Rollback Readiness
- [ ] Previous version canister ID documented (if needed for rollback)
- [ ] Backup of production data exists (export JSON before redeploy)
- [ ] Rollback procedure tested and ready if issues detected

## Local Dev Boot Flow

### Anonymous/Logged Out State
- [ ] App loads and shows login prompt (not blank page)
- [ ] No console errors during initial load
- [ ] "Initializing..." spinner shows briefly then transitions to login prompt
- [ ] Login button is clickable and functional

### Login Flow
- [ ] Clicking login opens Internet Identity
- [ ] After successful login, app shows "Initializing..." briefly
- [ ] For new users: Profile setup modal appears automatically
- [ ] For existing users: Dashboard loads directly
- [ ] No "You don't have a draft yet" message appears incorrectly

### Profile Setup (New Users)
- [ ] Profile setup modal appears after first login
- [ ] Name input field is functional
- [ ] "Save Profile" button works
- [ ] After saving, modal closes and dashboard appears
- [ ] Profile name appears in header dropdown

## Core Functionality Tests

### Authentication
- [ ] Login with Internet Identity succeeds
- [ ] User profile name displays in header after login
- [ ] Logout clears all cached data
- [ ] After logout, login prompt appears again
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
- [ ] Attempting actions while logged out shows login prompt
- [ ] Missing profile triggers profile setup modal
- [ ] Unauthorized actions show clear error messages

### Validation Errors
- [ ] Empty field names are rejected
- [ ] Empty task names are rejected
- [ ] Invalid attribute values are rejected
- [ ] Clear error messages guide user to fix issues

## Performance and UX

### Loading States
- [ ] Spinners appear during async operations
- [ ] Buttons show loading state during mutations
- [ ] No blank screens or frozen UI
- [ ] Transitions are smooth and responsive

### Data Consistency
- [ ] Field metrics update after task changes
- [ ] Task counts are accurate
- [ ] Duration totals are correct
- [ ] Changes persist after page refresh

## Regression-Specific Checks

### Boot Flow Fixes
- [ ] No "You don't have a draft yet" message in local dev
- [ ] Profile setup modal doesn't flash unnecessarily
- [ ] Actor initialization completes before showing dashboard
- [ ] Boot fallback doesn't override mounted React app

### Actor Readiness
- [ ] "New Field" button doesn't show "Connecting..." indefinitely
- [ ] Mutations don't fail with "Actor not ready" errors
- [ ] Login → profile setup → dashboard flow is seamless
- [ ] No race conditions between actor and profile queries

## Sign-Off

- [ ] All checks passed
- [ ] No regressions detected
- [ ] Ready for deployment

**Tested by:** _________________  
**Date:** _________________  
**Environment:** [ ] Local Dev  [ ] Production  
**Deployment Type:** [ ] Feature Release  [ ] Redeploy-Only  
**Notes:** _________________
