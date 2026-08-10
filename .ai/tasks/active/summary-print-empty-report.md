# Summary Print Empty Report

## Meta

- ID: TASK-130
- Status: done
- Owner: agent
- Last Updated: 2026-08-10

## Goal

Allow Morning, Evening, and Day summary print actions to print valid zero-sales reports.

## Findings

- Bill printing uses a separate payload and succeeds independently.
- Summary reports can legitimately return `items: []`.
- Electron validation and the Python printer request model rejected empty summary item lists with a server error.

## Implementation

- Allow empty summary items in the Electron main-process validator.
- Allow empty summary items in the Windows printer agent; it prints the date range and zero totals.
- Day Summary now requests Morning and Evening separately because the backend requires `shift` even though older route notes documented it as optional.

## Verification

- `cmd /c npm run build` passed (typecheck and Electron Vite build).
- Printer agent request model now accepts an empty summary payload.
