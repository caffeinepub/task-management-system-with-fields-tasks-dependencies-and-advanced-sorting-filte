# Specification

## Summary
**Goal:** Remove unwanted transparency on task cards and task-related modal dialogs so underlying content does not bleed through in light or dark themes.

**Planned changes:**
- Update TaskCard styling to use solid, fully opaque backgrounds in both light and dark themes, including on hover/focus states.
- Update Create Task, Edit Task, and Delete Task confirmation modal surfaces to use solid, fully opaque backgrounds wherever they appear, while keeping text readable in both themes.
- Ensure changes are implemented without modifying any files under `frontend/src/components/ui`.

**User-visible outcome:** Task cards and task modals display with solid backgrounds in light and dark themes, eliminating see-through surfaces and improving readability.
