# Summary Print Tab And Day Reports Task

## Meta

- ID: `TASK-002`
- Status: `done`
- Owner: `agent`
- Source: `User raw task note from the inbox`
- Last Updated: `2026-04-01`

## Goal

Add a third workspace tab for summary printing so operators can print morning, evening, and full-day summary reports for a selected date using the same printer flow as the Billing Desk.

## Scope

- add a third tab alongside the existing workspace tabs so the app has three top-level tabs in that section
- give the new tab a clear clinic-facing label for summary printing
- add a date input in the summary-print tab
- default the selected date to today
- add three print actions:
  - Print Morning Report
  - Print Evening Report
  - Print Day Summary
- make each action print the report for the currently selected date
- reuse the same printer integration path already used by the Billing Desk instead of introducing a separate renderer-side print path
- keep the report-fetch and print flow on the Electron main/preload side

## Constraints

- preserve the current Billing Desk and Booking List behavior while introducing the third tab
- keep the workflow simple and explicit for non-technical clinic operators
- use the same printer target and print-service pattern already established for Billing Desk printing
- avoid hardcoding backend or printer host details in renderer code

## API Notes

- the backend guide is documented in `.ai/resources/electron-day-summary-agent-guide.md`
- summary data comes from:
  - `GET /api/reports/day-summary`
- required query parameters and behavior:
  - `shift` is required and must be `morning` or `evening`
  - `date` is optional in the backend, but the Electron app should send the selected date explicitly for deterministic reprints
- auth requirements:
  - this is not a public bearer-token endpoint
  - it requires trusted-site headers plus an authenticated Sanctum user token
  - the authenticated user must have the `admin` role
- payload handling:
  - the backend response already matches the expected shape for the Windows `print_summary.py` flow
  - the Electron app should pass the response body through to the printer service without renaming fields
- resolved implementation:
  - `Print Day Summary` prints both morning and evening summaries in sequence through the same printer flow because the documented backend endpoint is shift-based

## Open Questions

- confirm the final label for the new third tab
- confirm whether non-admin operators should see the tab but be blocked at print time, or whether the tab should only appear for sessions that already satisfy the route access requirements

## Done When

- the workspace includes a third summary-print tab without regressing Billing Desk or Booking List behavior
- the summary-print tab defaults to today and lets the operator change the date
- operators can trigger morning, evening, and day-summary printing from the selected date
- the print flow reuses the existing Electron printer path rather than browser printing
- `Print Day Summary` runs morning and evening report prints back-to-back for the selected date
