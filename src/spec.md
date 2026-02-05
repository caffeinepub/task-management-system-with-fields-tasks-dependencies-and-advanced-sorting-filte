# Specification

## Summary
**Goal:** Make the All Tasks list more compact by moving the field tag into each task card and reducing vertical spacing.

**Planned changes:**
- Remove the separate field badge rendered above each task card in the All Tasks view.
- Render the task’s field tag as a small badge inside the TaskCard (e.g., in the header row near the task title) while keeping the current badge styling.
- Reduce vertical spacing in the All Tasks view (margins/padding between cards and within card layout) without changing task actions or content (complete/undo, edit, delete, dependencies).

**User-visible outcome:** In All Tasks, task cards appear more compact: the field tag is shown inside each card and the list has less vertical spacing, while all existing task interactions remain the same.
