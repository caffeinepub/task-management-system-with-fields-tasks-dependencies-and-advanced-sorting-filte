# Specification

## Summary
**Goal:** Remove backend restrictions that block Field deletion and ensure Fields can be deleted even when they contain tasks.

**Planned changes:**
- Remove the backend “at least two actors/users required” restriction when deleting a Field.
- Remove the backend rule that prevents Field deletion based on the caller needing to keep at least two Fields.
- Update backend Field deletion to cascade-delete all tasks in the deleted Field and clean up remaining tasks’ dependency references to any deleted tasks.

**User-visible outcome:** Users can delete their own Fields even if they are the only user/creator in state, even if it’s their last Field, and even if the Field contains incomplete tasks (with associated tasks and dependency references cleaned up automatically).
