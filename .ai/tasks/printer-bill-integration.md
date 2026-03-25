# Printer Bill Integration Task

## Goal

Configure the local printer service URL through `.env` and route bill printing through the Electron main/preload boundary instead of `window.print()`.

## Scope

- add printer base URL config to `.env` and `.env.example`
- inspect the local Python printer service contract
- send bill print payloads to the printer service after bill creation
- keep renderer code free of direct printer host assumptions

## Constraints

- printer service runs locally at `http://0.0.0.0:5000`
- printer request body must match the FastAPI `PrintRequest` model
- preserve the existing API-backed bill creation flow
