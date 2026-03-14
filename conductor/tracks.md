# Tracks Registry

Active development tracks for the POS Integration Platform.

| Status | Track ID | Title | Created | Updated |
| ------ | -------- | ----- | ------- | ------- |

*No tracks registered yet.*

---

## Track Status Legend

- `[x]` Complete
- `[~]` In Progress
- `[ ]` Pending
- `[!]` Blocked

## Commands

- `/gsd:new-track "description"` - Create a new track
- `/gsd:status` - View project status
- `/gsd:status {track-id}` - View specific track status
- `/gsd:implement {track-id}` - Start/resume implementation
- `/gsd:revert {track-id}` - Undo work on a track

## Track Directory Structure

```
conductor/tracks/
├── {track-id}/
│   ├── spec.md         # Specification
│   ├── plan.md         # Implementation plan
│   ├── metadata.json   # Track metadata
│   └── journal.md      # Development journal
```
