# Production Redeploy Runbook

This runbook documents the complete, deterministic process for performing a clean production redeploy from the current repository state.

## Purpose

Use this runbook when you need to:
- Redeploy the current codebase to production
- Ensure a fresh build artifact is created (not reusing older builds)
- Validate that production reaches the authenticated Dashboard after Internet Identity login
- Recover from deployment failures or infrastructure issues

**Important:** This is a redeploy-only procedure. No new features should be introduced during this process.

## Prerequisites

Before starting the redeploy:

- [ ] Access to production deployment environment (dfx identity configured)
- [ ] Current repository state is stable and tested locally
- [ ] Backup of production data exists (export JSON from production before redeploy)
- [ ] Previous version canister IDs documented (for rollback if needed)
- [ ] Correct tool versions installed:
  - Node.js (v18 or later)
  - pnpm (v8 or later)
  - dfx (latest stable version)
- [ ] Wallet/identity has sufficient cycles for deployment
- [ ] Team notified of planned redeploy (if applicable)

## Pre-Redeploy: Capture Current State

### 1. Record Current Canister IDs

Before making any changes, document the currently deployed canister IDs:

