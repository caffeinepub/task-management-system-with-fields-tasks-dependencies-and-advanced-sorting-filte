# Specification

## Summary
**Goal:** Stop intermittent “User is not registered” failures during Field creation after Internet Identity login, and guide users into profile setup when registration is genuinely required.

**Planned changes:**
- Backend: remove the intermittent authorization/registration condition that triggers “User is not registered” during Field creation for authenticated users.
- Backend: make Field creation behavior deterministic for users without a saved profile (either consistently allow creation or consistently return an intentional, mappable error).
- Frontend: normalize “User is not registered” / “not registered” Field creation errors into a clear English prompt to complete profile setup (not the generic creation failure message).
- Frontend: on the not-registered condition, refresh/refetch current user profile state so the ProfileSetupModal is shown when appropriate.
- Regression coverage: add a documented verification path (and/or lightweight test where supported) reproducing the prior failure mode and confirming the fix in fresh sessions and after profile save.

**User-visible outcome:** After logging in with Internet Identity, users can create Fields without intermittently seeing “User is not registered.” If a profile is required, the app clearly prompts profile setup and then allows Field creation after the profile is saved.
