# Direct Printer Routing

## Meta

- ID: TASK-120
- Status: done
- Owner: agent
- Last Updated: 2026-08-03

## Goal

Send receipt and summary print jobs directly to the configured physical printer instead of Microsoft Print to PDF.

## Completed

- configured `.env` and `.env.example` for `C:/test/test-p` and `127.0.0.1:5000`
- changed the external bill route to `EPSON-LQ-310`
- confirmed port 5000 is open
- verified `npm run build`
