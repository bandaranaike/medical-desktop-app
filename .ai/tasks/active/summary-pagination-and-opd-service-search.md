# Summary Pagination And OPD Service Search

## Meta

- ID: `TASK-127`
- Status: `done`
- Owner: `agent`
- Source: `.ai/tasks/inbox/raw-user-tasks.md`
- Last Updated: `2026-08-08`

## Goal

Add operator-friendly pagination to Summary Prints and make the OPD service search state clear while the backend contract is pending.

## Scope

- paginate active bills at 20 per page
- paginate grouped services at 40 per page
- keep pagination stable when the underlying list changes
- show an initial OPD service row and explain the current two-character search threshold
- retain local suggestions while reporting that API-backed suggestions require the backend route

## Dependencies

- Backend task `TASK-128`
- `.ai/resources/backend-opd-service-lookup-request.md`

## Done When

- Summary Prints displays no more than 20 bills and 40 service groups per page
- page controls reset safely after refresh/delete
- OPD has an immediately usable service row and clear search guidance
- typecheck/build pass
