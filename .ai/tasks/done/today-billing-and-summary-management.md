# Today Billing And Summary Management

## Meta

- ID: TASK-125
- Status: done
- Owner: agent
- Last Updated: 2026-08-04

## Completed

- Restricted non-booking bills to today in the renderer and backend.
- Reset the billing date to today whenever Booking is unchecked.
- Kept one combined printable list for today while providing separate Morning and Evening summary print buttons.
- Added Morning/Evening badges, individual bill reprints, active counts, and the active daily total.
- Added public API routes to list today's paid bills (including soft-deleted rows) and soft-delete bills.
- Kept deleted bills visible in a bottom audit section while excluding them from daily summary totals.
- Shift-summary printing sends the selected Morning or Evening filter to the backend; the combined bill list remains unchanged.
- Updated API and route references.

## Verification

- `pnpm build` passed.
- Laravel public API and day-summary suites passed: 20 tests, 175 assertions.
- Live Electron billing view rendered with the non-booking date locked to today.
