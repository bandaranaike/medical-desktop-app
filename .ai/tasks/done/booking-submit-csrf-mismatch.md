# Booking API Route Alignment

## Meta

- ID: `TASK-119`
- Status: `done`
- Owner: `agent`
- Source: `chat requests on 2026-05-05 and 2026-08-04 about booking API authentication errors`
- Last Updated: `2026-08-04`

## Goal

Keep Electron booking submission and listing on the documented API routes without CSRF or Sanctum authentication failures.

## Completed

- booking submission uses `POST /api/bookings/make-appointment`
- booking listing uses `GET /api/public/bookings?date=YYYY-MM-DD`
- an empty public booking response is returned as an empty list instead of triggering an authenticated bills-route fallback
- booking-list dates are validated before making an API request

## Verification

- `pnpm typecheck`
- `pnpm build`
