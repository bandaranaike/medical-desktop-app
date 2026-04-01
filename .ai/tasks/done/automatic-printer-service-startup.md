# Automatic Printer Service Startup Task

## Meta

- ID: `TASK-003`
- Status: `done`
- Owner: `agent`
- Source: `.ai/tasks/inbox/raw-user-tasks.md`
- Last Updated: `2026-04-01`

## Goal

Start the local Python printer service automatically when the Electron app launches so operators do not need to run `python .\printer-run.py` manually in either development or production.

## Scope

- inspect the bundled printer service files in `.ai/resources/printer/`
- define how Electron main process should launch the Python printer service during app startup
- support automatic startup in both development and packaged production environments
- define how the app should find the printer service files at runtime
- surface clear failure reporting if the printer service cannot be started
- ensure the existing receipt and summary print flows continue using the same local service on port `5000`

## Constraints

- current manual startup command is `python .\printer-run.py`
- the user guarantees Python is installed on target systems
- printer service currently lives outside the application folder, which creates a packaging and path-resolution decision
- packaged builds exclude source files by default, so printer runtime files must be intentionally included or copied if they need to ship with the app
- privileged process management belongs in the Electron main process, not the renderer

## Dependencies

- `.ai/resources/printer/printer-run.py`
- `.ai/resources/printer/main.py`
- `.ai/tasks/triage/printer-bill-integration.md`
- `electron-builder.yml`
- `.ai/architecture-notes.md`

## Resolved Decisions

- `PRINTER_FOLDER` is now configurable through environment config
- development defaults to the repo printer folder, while packaged builds default to the unpacked bundled printer folder
- `PRINTER_PORT` is now configurable through environment config
- the app checks whether the configured port is already open before spawning the Python printer service
- packaged builds now unpack `.ai/resources/printer/**` so the bundled Python files are available on disk

## Done When

- the Electron app attempts to start the printer service automatically on launch in dev and prod
- printer startup path resolution is documented and works predictably
- startup failures are visible enough for operators or support staff to act on them
- the manual pre-step of opening a separate terminal for `printer-run.py` is no longer required
