# Specification

## Summary
**Goal:** Prevent the Field Details page from going blank when opening the Edit Field dialog, and provide a friendly recovery UI if a rendering error occurs.

**Planned changes:**
- Make the Edit Field dialog icon picker resilient to missing/invalid lucide-react icon component names by skipping unknown icons or rendering a safe fallback.
- Add a React error boundary around the Field Details page area (FieldDetailView and related dialogs) to show an in-app error state with recovery actions instead of a blank screen.

**User-visible outcome:** From the Field Details page, users can click “Edit” and reliably see the Edit Field dialog without a blank screen; if something still breaks at runtime, they see an error panel with options like retry or go back rather than the app becoming unusable.
