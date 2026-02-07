# Specification

## Summary
**Goal:** Stop the post-login dashboard render crash caused by invalid/non-hex field color strings (e.g., "teal") by safely falling back to the app’s default color.

**Planned changes:**
- Update FieldCard to validate stored field color values and only pass valid 6-digit hex colors into soft tint styling; otherwise use the app default color.
- Make soft tint color utility helpers resilient by handling invalid/non-hex inputs without throwing and returning a tint derived from the app default color.

**User-visible outcome:** After clicking the login button, the dashboard renders reliably (including FieldCard styling) even when a field’s saved color is an invalid string, with the UI using the app default color instead of crashing.
