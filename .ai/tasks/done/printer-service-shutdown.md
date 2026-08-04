# Printer Service Shutdown

## Meta

- ID: TASK-121
- Status: done
- Owner: agent
- Last Updated: 2026-08-04

## Goal

Take the local printer service offline when the Electron application closes.

## Completed

- Electron now waits for printer cleanup during `before-quit`.
- The app-owned printer process is stopped.
- On Windows, Python `printer-run.py` processes are stopped so an already-running service on port 5000 is also taken offline.
- Shutdown waits briefly for the configured printer port to close.
