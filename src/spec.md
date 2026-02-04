# Specification

## Summary
**Goal:** Fix failures where authenticated Internet Identity users cannot create a Field, and ensure the UI reliably reflects the newly created Field without a full refresh.

**Planned changes:**
- Reproduce and document the Field creation failure for authenticated users, capturing frontend console errors and any backend reject/trap messages, and summarize the root cause.
- Fix Field creation reliability for authenticated users (including immediately after login) by addressing identity/actor readiness and ensuring the Fields list updates automatically after success.
- Improve Field creation error handling to provide clear, distinguishable English messages and recovery guidance for: not logged in, actor initializing/unavailable, and authorization errors.

**User-visible outcome:** Logged-in users can create Fields consistently (including right after login), see a success message, and immediately see the new Field appear in the Fields list without refreshing; if creation fails, the UI explains why and what to do next.
