# Billing Desk Dynamic Services And Split Pricing

## Meta

- ID: `TASK-115`
- Status: `blocked`
- Owner: `agent`
- Source: `.ai/tasks/inbox/raw-user-tasks.md` note added on `2026-04-01`
- Last Updated: `2026-04-01`

## Goal

Update the Billing Desk so Others, Channeling, and Dental support API-backed service autofill and explicit in-house/referred pricing that matches the medical-center billing workflow.

## Scope

- add dynamic service entry in the Billing Desk `Others` tab so operators can type or select services instead of relying only on fixed UI items
- support autocomplete for service names using API-backed service data when a usable endpoint exists
- send dynamically selected or newly entered services in the bill creation payload
- allow an explicit `no doctor` option for `Others` bills where doctor selection is optional
- replace the current single/split pricing behavior with separate `In-house` and `Referred` inputs where required
- update Dental fee entry so registration stays in-house and other dental services capture in-house and referred values separately
- update Channeling fee behavior so doctor consultation fee is treated as referred and booking/channeling fee is treated as in-house
- keep the Electron main/preload/renderer boundary aligned with repo guidance for any new API access

## Constraints

- keep the workflow simple and fast for clinic operators
- prefer existing backend routes before introducing new ones
- do not hardcode API host logic in the renderer
- preserve current user changes and existing triage tasks unless this work explicitly supersedes them

## Dependencies

- `.ai/product-spec.md`
- `.ai/project-context.md`
- `.ai/resources/routes.json`
- `.ai/resources/API_ENDPOINTS.md`
- `.ai/resources/api-database.sql`
- companion task `TASK-116` for any missing backend endpoints or request-shape changes

## Open Questions

- can existing `services` data and endpoints be exposed safely for receptionist autocomplete, or is a new reception-safe lookup route required
- what exact request shape should the bill creation API accept for mixed in-house/referred service items across Others, Dental, and Channeling
- should ad hoc typed services be persisted immediately as new `services` records, or only when the bill is finalized

## Blocked On

- backend service search/autocomplete endpoint for receptionist-safe Electron use
- backend bill create/update/read support for split in-house/referred items
- backend doctor billing config defaults for Channeling and Dental

## Done When

- Billing Desk supports API-backed service lookup and entry for the requested tabs
- in-house and referred amounts are captured and sent separately where required
- Others supports bills without a doctor and includes custom services in bill creation
- the app-side work is documented in code/task tracking with any backend dependency clearly called out



