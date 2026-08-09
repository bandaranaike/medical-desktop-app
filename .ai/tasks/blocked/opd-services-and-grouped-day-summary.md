# OPD Services, Required Patient Fields, And Grouped Day Summary

## Meta

- ID: `TASK-126`
- Status: `blocked`
- Owner: `agent`
- Source: `.ai/tasks/inbox/raw-user-tasks.md` note added on `2026-04-01`
- Last Updated: `2026-08-07`

## Goal

Extend the Billing Desk so OPD supports the same dynamic service entry pattern as Others, make the required patient fields explicit, and add a grouped full-day summary action and view.

## Scope

- keep OPD Doctor Consultation Fee and OPD Medicine Fee
- add OPD service rows with API-backed autocomplete and ad-hoc entry payloads
- mark Patient Information Name, Telephone, and Age as required in the UI and validation
- add Print Day Summary to Summary Prints
- show active daily bill items grouped by service with cumulative quantity and amount
- document backend changes needed to expose service lookup/create and persist ad-hoc service items

## Dependencies

- Existing public bill and day-summary routes
- Backend handoff: `.ai/resources/backend-service-lookup-and-grouped-summary-request.md`

## Current State

- Desktop implementation is complete and typecheck/build pass.
- Blocked until the backend team implements the service lookup/create contract in the handoff document. Until then, typed services remain ad-hoc bill items and are not inserted into the `services` table.
