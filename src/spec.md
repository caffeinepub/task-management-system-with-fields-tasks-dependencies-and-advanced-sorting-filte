# Specification

## Summary
**Goal:** Stop the app from incorrectly showing the blocking “Please complete your profile to continue” message during normal usage, and ensure the correct missing-profile flow reliably guides users to complete setup.

**Planned changes:**
- Tighten the frontend “User is not registered” detection in `frontend/src/utils/bootErrorMessages.ts` so it only matches the explicit missing-profile condition (and no longer matches generic substrings like “not registered” for unrelated errors).
- Route authenticated users with a true missing-profile response into the `ProfileSetupModal` flow (instead of a boot error screen/toast), and ensure a successful profile save refreshes profile state, dismisses the modal, and proceeds to the Dashboard.
- Standardize missing-profile user-facing copy to a single consistent English string across boot error normalization and profile-save error normalization, while preventing missing-profile messaging from appearing for unrelated errors.

**User-visible outcome:** Authenticated users are no longer blocked by a false “Please complete your profile to continue” message during normal usage; users who truly lack a profile are guided through profile setup and then land on the Dashboard after saving.
