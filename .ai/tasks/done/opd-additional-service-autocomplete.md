# OPD Additional Service Autocomplete

## Meta

- ID: TASK-131
- Status: done
- Owner: agent
- Last Updated: 2026-08-10

## Request

In Billing Desk → Billing Operations → OPD, make the Additional OPD Services service field behave like the Others service field and provide autocomplete suggestions.

## Implementation status

Already implemented in the current renderer and main-process code:

- OPD service inputs use a per-row HTML `datalist`.
- Suggestions start after two typed characters.
- Local recent services are merged with API suggestions.
- API lookup is routed through the preload/main boundary.
- Selecting a suggestion applies the service name, service id, and available prices.
- New unmatched service names remain supported as ad-hoc bill items.

## Verification

- Confirmed the OPD input and Others input use the same suggestion workflow.
- Application build/typecheck to be run after task intake.
