# Specification

## Summary
**Goal:** Provide a complete, actionable production redeploy runbook for performing a clean redeploy from the current repository state (fresh build artifacts), including verification, rollback guidance, and a lightweight post-deploy smoke test.

**Planned changes:**
- Update `frontend/docs/production-redeploy-runbook.md` to be complete (not truncated) and fully step-by-step, covering prerequisites, exact commands for clean build + deploy, verification that canisters and frontend assets updated in production, and how to capture/record canister IDs for rollback.
- Ensure all runbook text is in English and explicitly frames the process as a redeploy-only (no new features), including validation that production boots and reaches the authenticated Dashboard after Internet Identity login.
- Add a lightweight smoke-test procedure in the redeploy runbook that references `frontend/docs/production-smoke-check-results-template.md` for recording results and stays consistent with `frontend/docs/deploy-and-localdev-regression-checklist.md`.

**User-visible outcome:** After a production deployment issue, a maintainer can follow an end-to-end runbook to perform a clean production redeploy, quickly verify core functionality via a short smoke test, and record rollback-critical details and test results.
