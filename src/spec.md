# Specification

## Summary
**Goal:** Make all dialogs/popups fully readable by applying a global non-transparent modal style, and restore Heroicons so all predefined/dynamic icons render correctly across the app.

**Planned changes:**
- Apply global styling overrides so all Dialog/AlertDialog overlays use a clearly visible dimmed backdrop and all modal content surfaces use an opaque theme-consistent background in both light and dark mode (without editing read-only `frontend/src/components/ui` files).
- Restore Heroicons as the predefined icon set and ensure icon presets and dynamic icon lookup by string identifier resolve to Heroicons components reliably (including production builds), across existing flows and dialogs.

**User-visible outcome:** Modals/popups are no longer see-through in light or dark mode, and icons (including field icons and icons in dialogs/buttons) display consistently without missing/broken placeholders.
