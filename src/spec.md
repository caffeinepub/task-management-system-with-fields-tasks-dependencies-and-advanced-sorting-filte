# Specification

## Summary
**Goal:** Fix the intermittent “User is not registered” startup/auth failure so Internet Identity users can reliably proceed through profile setup and use core features (including creating Fields) without manual workarounds.

**Planned changes:**
- Backend: Adjust authorization/registration handling so a newly authenticated principal is treated as a valid normal user on first use (or otherwise avoid throwing “User is not registered” for legitimate II users).
- Backend: Make `getCallerUserProfile` non-fatal for brand-new principals (e.g., return null/none equivalent) and allow `saveCallerUserProfile` followed by `createField` to succeed for new users.
- Frontend: Improve detection of “User is not registered” across common Internet Computer error shapes (nested reject fields / stringified objects), and route the user into the intended profile setup flow instead of a boot-failure UI.
- Frontend: When the error occurs during actions like create Field, refresh profile state and prompt profile setup rather than showing a generic failure toast; ensure user-facing messaging is clear English and does not expose raw IC/canister error blobs.

**User-visible outcome:** After logging in with Internet Identity, users no longer hit a blocking “User is not registered” error; new users are guided into profile setup and can then create a Field reliably, with repeated reloads no longer randomly failing.
