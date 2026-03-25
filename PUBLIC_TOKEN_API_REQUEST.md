# Public API Request for Token-Based Authentication

## Purpose

This document requests a public API contract for the Electron medical-center application at `C:\Users\eragr\5th-electron-app`.

The current backend API is partly designed around staff authentication flows, role-based middleware, and Sanctum session/token usage that fit a web application. This desktop application currently needs a simpler integration model:

- app-to-server authentication using configured tokens
- no browser session or CSRF dependency
- no operator login requirement inside the Electron billing flow
- stable API routes for patient search, patient create/update, doctor list, and bill creation

## Current App Integration Model

The Electron app reads API configuration from `.env` and sends requests from the main process.

Current request headers sent by the app:

```http
Accept: application/json
Content-Type: application/json
X-API-KEY: <api-key>
Referer: <trusted-app-referer>
Authorization: Bearer <static-app-token>
```

Current backend base URL is configurable and must remain configurable.

## Current Functional Needs in This App

The desktop workflow is for clinic operators to:

- search patient records by telephone or patient name
- autofill patient details
- create or update patient records
- load doctor list for billing
- create bills for OPD, Channeling, Dental, and Other services

According to the current app code, the Electron app uses these routes:

- `GET /api/patients/search?query=...`
- `GET /api/doctors?sort[]=name`
- `POST /api/patients`
- `PUT /api/patients/{id}`
- `POST /api/bills`

## Current Problem

There is an authentication mismatch between the Electron app and the old API design.

### 1. Patient search is not public enough for this app

The route guide shows:

- `GET /api/patients/search`
- requires Sanctum
- requires role `reception`

But this desktop app needs patient lookup during billing without a per-user reception login flow.

### 2. Some existing routes are designed for user-role authentication, not app-token access

Several API routes depend on:

- Sanctum bearer tokens tied to logged-in users
- role middleware such as `reception`, `admin`, or `doctor`
- patterns originally suited to browser or staff-account flows

That makes the API difficult to use from a desktop application that is configured with environment-based credentials and should work as a trusted clinic client.

### 3. The project requires token-based integration

For this project, we need authentication using tokens supplied by configuration, not session/cookie-based authentication and not a manual login dependency for the billing operator workflow.

## Requested Backend Change

Please provide a public API surface for this Electron app that authenticates using tokens and supports the required billing workflow.

### Requested authentication model

We request support for one of these models:

1. Preferred:
   API key + trusted referer + dedicated app bearer token
2. Acceptable:
   API key + dedicated server-issued personal access token for this desktop app

Important requirement:

- the token must be usable directly from the Electron app
- the token must not depend on browser session cookies
- the token must not require CSRF flow
- the token should represent the application or clinic client, not an interactive staff login

## Requested Route Contract

Please make the following routes usable with the app token authentication model.

### 1. Patient search

`GET /api/public/patients/search?query=<name-or-phone>`

Expected behavior:

- search by telephone number
- search by patient name
- return enough fields to autofill the billing form

Suggested response shape:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Patient Name",
      "telephone": "+94770000000",
      "email": "patient@example.com",
      "age": 30,
      "gender": "male",
      "address": "Address"
    }
  ]
}
```

### 2. Patient create

`POST /api/public/patients`

Suggested request body:

```json
{
  "name": "Patient Name",
  "telephone": "+94770000000",
  "email": "patient@example.com",
  "age": 30,
  "gender": "male",
  "address": "Address"
}
```

Expected behavior:

- create patient if not existing
- return created patient object

### 3. Patient update

`PUT /api/public/patients/{id}`

Expected behavior:

- update patient details from the billing form
- return updated patient object

### 4. Doctor list

`GET /api/public/doctors?sort[]=name`

Expected behavior:

- return doctors needed by the billing screen
- include at least:
  - `id`
  - `name`
  - `telephone`
  - `email`
  - `doctor_type`
  - `specialty` or `specialty_name`

### 5. Bill creation

`POST /api/public/bills`

Suggested request body:

```json
{
  "bill_amount": 2500,
  "payment_type": "cash",
  "system_amount": 0,
  "patient_id": 1,
  "doctor_id": 12,
  "is_booking": false,
  "service_type": "opd",
  "shift": "morning",
  "date": "2026-03-25"
}
```

Expected behavior:

- create a bill for the selected patient and doctor
- support the desktop billing workflow without user-role login
- return created bill data in JSON

## Recommended Implementation Direction

To avoid breaking existing web/staff flows, the safest backend approach is:

- keep the existing authenticated routes unchanged
- add a dedicated public token-authenticated route group for the Electron app
- protect that route group with:
  - `VerifyApiKey`
  - trusted `Referer` validation
  - app token validation middleware
- avoid `Authenticate:sanctum` and role middleware for these app-specific public routes unless the token itself carries the required app permission

Possible examples:

- `/api/public/patients/search`
- `/api/public/patients`
- `/api/public/doctors`
- `/api/public/bills`

## Minimum Data Needed by the Desktop App

### Patient fields

- `id`
- `name`
- `telephone`
- `email`
- `age`
- `gender`
- `address`

### Doctor fields

- `id`
- `name`
- `telephone`
- `email`
- `doctor_type`
- `specialty` or `specialty_name`

### Bill fields

- created bill identifier
- bill reference or UUID if available
- amount fields
- patient reference
- doctor reference
- status
- date
- shift

## Notes From Existing Backend Reference

Based on the current project documentation:

- most `/api/*` routes already use `X-API-KEY` and `Referer`
- some routes also require Sanctum bearer tokens
- `GET /api/patients/search` currently requires Sanctum plus `reception` role
- `POST /api/bills` is documented for `admin` and `reception`
- `GET /api/doctors` and `POST/PUT /api/patients` are also role-gated in the existing API design

This is the main reason a public app-token API is requested instead of reusing the old role-protected routes as-is.

## Open Questions for Backend Alignment

Please confirm these points when implementing:

- Should the public token represent one clinic installation, one app environment, or one trusted site?
- Should bill creation through the desktop app be restricted to a limited subset of services or doctor types?
- Should patient create/update be allowed for all trusted app tokens, or only selected tokens?
- Should audit fields identify requests as coming from the Electron app client?
- Should the app token be a static configured token, or should the backend provide a token issuance endpoint for this client?

## Requested Outcome

Please provide a backend API contract that allows this Electron project to:

- authenticate using configured tokens
- search patients without interactive staff login
- create or update patients
- load doctors for billing
- create bills

without depending on browser sessions, CSRF, or role-bound Sanctum login flows intended for the older web application.
