# Specification

## Summary
**Goal:** Improve Dashboard FieldCard usability by adjusting attribute layout and enabling user-selected light background colors that persist.

**Planned changes:**
- Update the FieldCard attribute list (Urgency, Value, Interest, Influence, Duration) to use a 3-column responsive grid at appropriate breakpoints.
- Ensure that on large screens the five attributes remain on a single horizontal row (no wrapping), using horizontal scrolling or another non-wrapping approach when needed.
- Add a user-selectable FieldCard background color option using a predefined light color palette.
- Define and expose a consistent set of light background color options (stable IDs + English labels) for reuse in the selection UI.
- Persist the selected background color so it is applied after page reloads wherever the FieldCard is rendered on the dashboard.

**User-visible outcome:** On the dashboard, FieldCards show their attributes in a cleaner 3-column layout and (on large screens) keep attributes on one non-wrapping row, and users can select a light background color for each FieldCard that is saved and consistently shown on reload.
