# Backend API Contract For Billing Services

## Meta

- ID: `TASK-116`
- Status: `planned`
- Owner: `agent`
- Source: `.ai/tasks/inbox/raw-user-tasks.md` note added on `2026-04-01`
- Last Updated: `2026-04-01`

## Goal

Define and document the backend/API changes needed to support dynamic billing services, doctor-based autofill, and separate in-house/referred pricing in the desktop app.

## Scope

- review the current API surface for `bills`, `bill-items`, `services`, and doctor fee lookups against the requested workflow
- identify which existing routes can be reused and which new endpoints or request changes are needed
- specify a receptionist-usable service lookup/autocomplete contract
- specify how bill creation should carry separate in-house and referred values for service items
- specify the fee lookup behavior needed for Channeling and Dental based on the selected doctor
- create a dedicated API change document for the backend/API team and future agent work

## Constraints

- align proposed contracts with the existing Laravel route/auth model where practical
- document auth expectations including `X-API-KEY`, `Referer`, and Sanctum needs
- avoid vague "backend changes may be needed" notes; list the concrete request and response expectations

## Dependencies

- `.ai/resources/routes.json`
- `.ai/resources/API_ENDPOINTS.md`
- `.ai/resources/api-database.sql`
- desktop integration task `TASK-115`
- backend project at `\\wsl.localhost\Ubuntu-24.04\home\eranda\test\test-b` if implementation moves beyond documentation

## Open Questions

- should the desktop app call admin-style service endpoints directly, or do we need separate reception-facing endpoints with narrower auth
- does the current bill storage model need new fields, or can separate in-house/referred amounts be represented entirely through bill items and service metadata
- should doctor-specific pricing come from existing channeling-fee data plus service defaults, or from a new doctor-service pricing model

## Done When

- a concrete API change document exists in `.ai/` for the backend/API team
- required new endpoints, payload changes, and auth expectations are listed clearly
- the dependency between backend work and desktop implementation is explicit in task tracking

