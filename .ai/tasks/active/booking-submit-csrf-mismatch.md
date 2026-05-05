# Booking Submit CSRF Mismatch

## Meta

- ID: `TASK-119`
- Status: `active`
- Owner: `agent`
- Source: `chat request on 2026-05-05 about CSRF token mismatch in createBooking`
- Last Updated: `2026-05-05`

## Goal

Fix the bill booking submission flow so Electron sends the booking request to the backend endpoint that matches the documented API middleware and avoids Laravel CSRF failures.

## Scope

- inspect the booking submit path in `src/main/index.ts`
- align documented booking endpoints used by the Electron main process
- verify the booking list fallback path still points at the documented bills booking route

## Constraints

- preserve existing unrelated worktree changes
- keep API calls in the main process
- avoid backend changes unless the frontend contract is clearly wrong

## Dependencies

- `.ai/resources/routes.json`
- `.ai/resources/API_ENDPOINTS.md`
- `src/main/index.ts`

## Open Questions

- whether booking update, delete, and proceed-to-payment routes are intentionally provided by backend custom routes outside the current route inventory

## Done When

- booking submit no longer targets the mismatched `/api/public/bookings/make-appointment` path
- documented booking list fallback uses the documented bills bookings endpoint
