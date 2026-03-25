# Public Token API Request Task

## Goal

Prepare a backend-facing request document for public API support that works with token-based authentication for this Electron app.

## Scope

- Summarize the current authentication mismatch between the app and the old API.
- Identify the routes currently used by the app for patient search, patient upsert, doctor list, and bill creation.
- Request a public token-based API contract that avoids session or role-bound interactive login assumptions.
- List required headers, expected route behavior, and open questions for backend alignment.

## Constraints

- The Electron app is configured from `.env` and currently sends `X-API-KEY`, `Referer`, and a bearer token from the main process.
- The app is not currently modeled around user-specific reception login inside the desktop workflow.
- The request should align with the medical-center billing workflow in `.ai/product-spec.md`.
