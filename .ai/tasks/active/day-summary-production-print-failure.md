# Day Summary Production Print Failure

## Status

Done

## Problem

Production day-summary printing fails when the public report endpoint returns a server error for a full-day request without a shift.

## Scope

- Build full-day summaries directly from persisted paid bills because the deployed public report route returns a server error.
- Preserve the paid-bill fallback.
- Log fallback failures with enough context to diagnose backend availability.

## Verification

- Typecheck/build the Electron main process.
- Confirm the full-day report combines duplicate service rows across shifts.
- Full-day printing now uses the paid-bill source directly and no longer calls the failing day-wide report endpoint.
- Node and renderer typechecks passed; Electron production build passed on 2026-08-19.
