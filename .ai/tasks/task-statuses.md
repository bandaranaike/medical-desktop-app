# Task Statuses

These statuses are the standard task states for `.ai/tasks/`.

## Status List

- `inbox`
  - raw user notes that have not yet been normalized into a structured task
- `triage`
  - existing or imported task notes whose current state still needs review
- `planned`
  - a structured task with defined scope that is ready to start
- `active`
  - currently in progress
- `blocked`
  - waiting on an answer, dependency, backend change, access, or other external unblocker
- `done`
  - implemented or otherwise completed
- `cancelled`
  - intentionally dropped and kept only for recordkeeping

## Tracking Rules

- Folder placement and `registry.md` should agree.
- When a task changes state, move the file into the matching folder and update `registry.md`.
- If the true state of an older task is unclear, do not guess; use `triage`.
- Raw inbox notes should stay simple and can remain in the user’s own language.
