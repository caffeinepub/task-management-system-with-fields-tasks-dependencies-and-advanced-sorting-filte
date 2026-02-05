# Production Redeploy Runbook

This runbook documents the process for performing a clean, fresh production redeploy from the current repository state without introducing new features.

## Purpose

Use this runbook when you need to:
- Redeploy the current codebase to production
- Ensure a fresh build artifact is created (not reusing older builds)
- Validate that production reaches the authenticated Dashboard after Internet Identity login

## Prerequisites

- [ ] Access to production deployment environment
- [ ] Current repository state is stable and tested
- [ ] Backup of production data exists (export JSON from production before redeploy)
- [ ] Previous version canister ID documented (for rollback if needed)

## Redeploy Process

### Step 1: Clean Build Environment

